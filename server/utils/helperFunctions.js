const piexif = require("piexifjs");

const removeExif = (attachment) => {
    const data = `data:${
        attachment.mimetype
    };base64,${attachment.data.toString("base64")}`;
    const image64 = piexif.remove(data);
    // Get orientation data
    const oldExif = piexif.load(data);
    const orientation = oldExif["0th"][piexif.ImageIFD.Orientation];
    const newExif = {
        // Keep the image orientation
        "0th": { 274: orientation },
        "1st": {},
        Exif: {},
        GPS: {},
        Interop: {},
        thumbnail: null
    };

    // Put orienation data into new image buffer
    const exifString = piexif.dump(newExif);

    return Buffer.from(
        piexif.insert(exifString, image64).split(";base64,")
            .pop(),
        "base64"
    );
};

module.exports = removeExif;
