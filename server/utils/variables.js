const supportedFileTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp"
];

const fileSizeLimit = 8 * 1024 * 1024;
const maxAttachments = 4;
const postCharLimit = 128;
const messageCharLimit = 1000;

module.exports = {
    fileSizeLimit,
    maxAttachments,
    messageCharLimit,
    postCharLimit,
    supportedFileTypes
};
