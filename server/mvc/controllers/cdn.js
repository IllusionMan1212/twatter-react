const getProfilePicture = (req, res) => {
    res.sendFile(
        `cdn/profile_images/${req.params.userId}/${req.params.fileName}`,
        { root: `${__dirname}/../../../` }
    );
};

const getPostImages = (req, res) => {
    res.sendFile(`cdn/posts/${req.params.postId}/${req.params.fileName}`, {
        root: `${__dirname}/../../../`
    });
};

const getMessageImage = (req, res) => {
    res.sendFile(
        `cdn/messages/${req.params.messageId}/${req.params.fileName}`,
        { root: `${__dirname}/../../../` }
    );
};

module.exports = {
    getMessageImage,
    getPostImages,
    getProfilePicture
};
