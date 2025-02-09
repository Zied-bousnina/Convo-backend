const BasicInfo = require("../models/BasicInfo.model.js")
const validateBasicInfoInput = require("../validations/BasicInfoValidation.js")
const cloudinary = require('../utils/uploadImage.js')
const logActivity = require("../utils/logger"); // Import logger

const AddBasicInfo = async (req, res) => {
    const { isValid, errors } = validateBasicInfoInput(req.body);

    try {
        if (!isValid) {
            await logActivity("Failed to Add Basic Info", req.user.id, { errors });
            res.status(404).json(errors);
        } else {
            if (req.files?.avatar?.size > 0) {
                const result = await cloudinary.uploader.upload(req.files.avatar.path, {
                    public_id: `${req.user.id}_profile`,
                    width: 500,
                    height: 500,
                    crop: 'fill',
                });

                req.body.avatar = result.secure_url;
            }

            const profile = await BasicInfo.findOne({ user: req.user.id });
            if (!profile) {
                const emailExist = await BasicInfo.findOne({ email: req.body.email });
                if (emailExist) {
                    errors.email = "Email already exists";
                    await logActivity("Failed to Add Basic Info", req.user.id, { reason: "Email already exists" });
                    res.status(404).json(errors);
                } else {
                    req.body.user = req.user.id;
                    const data = await BasicInfo.create(req.body);

                    await logActivity("Added Basic Info", req.user.id, req.body);
                    res.status(200).json({ data, success: true });
                }
            } else {
                if (profile.email !== req.body.email) {
                    const emailExist = await BasicInfo.findOne({ email: req.body.email });
                    if (emailExist) {
                        errors.email = "Email already exists";
                        await logActivity("Failed to Update Basic Info", req.user.id, { reason: "Email already exists" });
                        res.status(404).json(errors);
                    } else {
                        const result = await BasicInfo.findOneAndUpdate(
                            { user: req.user.id },
                            req.body,
                            { new: true }
                        );
                        var email = result.email;

                        await logActivity("Updated Basic Info", req.user.id, req.body);
                        res.status(200).json(result);
                    }
                } else {
                    const result = await BasicInfo.findOneAndUpdate(
                        { user: req.user.id },
                        req.body,
                        { new: true }
                    );
                    var email = result.email;

                    await logActivity("Updated Basic Info", req.user.id, req.body);
                    res.status(200).json(result);
                }
            }
        }
    } catch (error) {
        await logActivity("Error in AddBasicInfo", req.user.id, { error: error.message });
        res.status(500).json({ message1: "error2", message: error.message });
    }
};



const findBasicInfoByUserId = async (req, res) => {
    try {
        const basicInfo = await BasicInfo.findOne({ user: req.user.id });

        if (basicInfo) {
            await logActivity("Fetched Basic Info", req.user.id, { userId: req.user.id });
        } else {
            await logActivity("Basic Info Not Found", req.user.id, { userId: req.user.id });
        }

        res.status(200).json({ basicInfo });
    } catch (error) {
        await logActivity("Error in findBasicInfoByUserId", req.user.id, { error: error.message });
        res.status(500).json({ message1: "error2", message: error.message });
    }
};


module.exports = {

    AddBasicInfo,
    findBasicInfoByUserId

}

