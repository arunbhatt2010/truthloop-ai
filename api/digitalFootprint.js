import { loadDigitalFootprintBrain }
from "./DigitalFootprintBrain.js";

export default async function handler(req,res){
if (req.method !== "POST") {
    return res.status(405).json({
        success: false,
        message: "POST request required."
    });
}
    const {
    identityPackage,
    currentLoop,
    currentCategory,
    messages
} = req.body || {};
    const publicEvidencePackage =
        await loadDigitalFootprintBrain({

            truthLoopPackage:{

                messages,

                currentCategory

            },

            identityPackage,

            currentLoop

        });

    return res.json(publicEvidencePackage);

}
