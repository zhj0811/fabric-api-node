const Joi = require('joi');
const attachmentListSchema = Joi.array().items(
    Joi.object().keys({
        name: Joi.string().required(),
        hash: Joi.string().required(),
        path: Joi.string().required()
    })
);
const schema = Joi.array().items(
    Joi.object().keys({
        createBy: Joi.string().required(),
        createTime: Joi.number().required(),
        sender: Joi.string().required(),
        receiver: Joi.array().items(
            Joi.string().required()
        ).required(),
        txData: Joi.string().required(),
        attachmentList: attachmentListSchema,
        lastUpdateTime: Joi.number().required(),
        lastUpdateBy: Joi.string().required(),
        cryptoFlag: Joi.number().required(),
        cryptoAlgorithm: Joi.string().required(),
        docType: Joi.string().required(),
        fabricTxId: Joi.string(),
        businessNo: Joi.string().required(),
        expand1: Joi.string().required(),
        expand2: Joi.string().required(),
        dataVersion: Joi.string().required()
    })
);

const option = {
    abortEarly: true,   //检验到第一个错误时及时返回
    // allowUnknown: true  //默认false， 不允许对象包含被忽略的未知键。推荐设置 true
    // noDefaults:false    //如果为 true，则不应用默认值。默认为 false。推荐采用默认
    stripUnknown:true   //忽略多余字段
}

function SchemaValidator(msg){
    return Joi.validate(msg, schema, option);
}

module.exports={
    SchemaValidator
}
