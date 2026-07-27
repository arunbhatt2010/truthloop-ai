import { loadDigitalFootprintBrain }
from "./brains/DigitalFootprintBrain.js";

export default async function handler(req,res){

    const {

        identityPackage,

        currentLoop,

        currentCategory,

        messages

    } = req.body;

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
