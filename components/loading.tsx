/* eslint-disable react/react-in-jsx-scope */
import Image from "next/image";
import { ReactElement } from "react";
import { LoadingProps } from "src/types/props";

export default function Loading(props: LoadingProps): ReactElement {
    return (
        <div className="flex justify-content-center align-items-center">
            <Image
                src="/loading.svg"
                width={props.width}
                height={props.height}
                alt="loading..."
            ></Image>
        </div>
    );
}
