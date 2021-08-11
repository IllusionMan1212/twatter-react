import { FormEvent, MutableRefObject, SetStateAction } from "react";
import { IAttachment } from "src/types/general";
import { fileSizeLimit, maxAttachments, supportedFileTypes } from "./variables";

export const handlePaste = (
    e: React.ClipboardEvent<HTMLElement>,
    charLimit: number,
    charsLeft: number,
    setCharsLeft: (value: SetStateAction<number>) => void,
    setPostingAllowed: (value: SetStateAction<boolean>) => void,
    previewImages: Array<string>,
    setPreviewImages: (value: SetStateAction<Array<string>>) => void,
    attachments: Array<IAttachment>,
    setAttachments: (value: SetStateAction<Array<IAttachment>>) => void,
    toast: (text: string, length: number) => void
): void => {
    e.preventDefault();
    // handle pasting clipboard images
    if (e.clipboardData.files?.item(0)) {
        const file = e.clipboardData.files.item(0);

        if (!supportedFileTypes.includes(file.type)) {
            return;
        }
        if (file.size > fileSizeLimit) {
            toast("File size is limited to 8MB", 4000);
            return;
        }

        setPreviewImages(previewImages.concat(URL.createObjectURL(file)));
        setAttachments(
            attachments.concat({
                data: file,
                name: file.name,
                mimetype: file.type,
                size: file.size,
            })
        );
        if (charsLeft >= 0) {
            setPostingAllowed(true);
        }
    // handle pasting strings as plain text
    } else if (e.clipboardData.items?.[0].kind == "string") {
        const text = e.clipboardData.getData("text/plain");
        e.currentTarget.textContent += text;

        if (e.currentTarget.textContent.length > charLimit) {
            setPostingAllowed(false);
        } else if (e.currentTarget.textContent.length) {
            setPostingAllowed(true);
        }
        setCharsLeft(charLimit - e.currentTarget.textContent.length);
    }
};

export const handleKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    ref: MutableRefObject<HTMLElement>,
    handleClick: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void
): void => {
    if (e.key == "Enter") {
        e.preventDefault();

        if (!ref.current.textContent.length) return;

        document.execCommand("insertLineBreak");

        e.ctrlKey &&
            handleClick(
                (e as unknown) as React.MouseEvent<HTMLElement, MouseEvent>
            );
    }
};

export const handleInput = (
    e: FormEvent<HTMLElement>,
    charLimit: number,
    attachments: Array<IAttachment>,
    setPostingAllowed: (value: SetStateAction<boolean>) => void,
    setCharsLeft: (value: SetStateAction<number>) => void
): void => {
    if (e.currentTarget.textContent.trim().length > charLimit) {
        setPostingAllowed(false);
    } else if (
        e.currentTarget.textContent.trim().length != 0 ||
        attachments.length
    ) {
        setPostingAllowed(true);
    } else {
        setPostingAllowed(false);
    }
    setCharsLeft(charLimit - e.currentTarget.textContent.trim().length);
};

export const handleTextInput = (e: InputEvent): void => {
    // workaround android not giving out proper key codes
    if (
        e.data.charCodeAt(0) == 10 ||
        e.data.charCodeAt(e.data.length - 1) == 10
    ) {
        e.preventDefault();
        document.execCommand("insertLineBreak");
    }
};

export const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    attachments: Array<IAttachment>,
    setAttachments: (value: SetStateAction<Array<IAttachment>>) => void,
    previewImages: Array<string>,
    setPreviewImages: (value: SetStateAction<Array<string>>) => void,
    setPostingAllowed: (value: SetStateAction<boolean>) => void,
    toast: (text: string, length: number) => void
): void => {
    const files: File[] = Array.from(e.target?.files as ArrayLike<File>);
    const validFiles: Array<IAttachment> = [...attachments];
    const validPreviewImages: Array<string> = [...previewImages];

    if (files.length > maxAttachments) {
        toast("You can only upload up to 4 images", 4000);
        return;
    }
    for (let i = 0; i < files.length; i++) {
        if (!supportedFileTypes.includes(files[i].type)) {
            toast("This file format is not supported", 4000);
            continue;
        }
        if (files[i].size > fileSizeLimit) {
            toast("File size is limited to 8MB", 4000);
            continue;
        }
        if (
            attachments.length < maxAttachments &&
            previewImages.length < maxAttachments
        ) {
            validFiles.push({
                data: files[i],
                name: files[i].name,
                mimetype: files[i].type,
                size: files[i].size,
            });
            validPreviewImages.push(URL.createObjectURL(files[i]));
        }
    }
    if (validPreviewImages.length) {
        setPostingAllowed(true);
        setPreviewImages(validPreviewImages);
        setAttachments(validFiles);
    }
    // TODO: videos
};

export const handlePreviewImageClose = (
    _e: React.MouseEvent<HTMLElement, MouseEvent>,
    i: number,
    previewImages: Array<string>,
    setPreviewImages: (value: SetStateAction<Array<string>>) => void,
    attachments: Array<IAttachment>,
    setAttachments: (value: SetStateAction<Array<IAttachment>>) => void,
    ref: MutableRefObject<HTMLElement>,
    setPostingAllowed: (value: SetStateAction<boolean>) => void
): void => {
    const tempPreviewImages = [...previewImages];
    tempPreviewImages.splice(i, 1);
    setPreviewImages(tempPreviewImages);
    const tempAttachments = [...attachments];
    tempAttachments.splice(i, 1);
    setAttachments(tempAttachments);
    // if there're no attachments AND no text, disable the posting button
    if (!tempAttachments.length && !ref.current.textContent.trim().length) {
        setPostingAllowed(false);
    }
};
