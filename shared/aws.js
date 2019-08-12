const AWS = require('aws-sdk');
// import * as tools from './helpers/tools';
const config = require('./config');
const logger = require('./logger');
const tools = require('./tools');

// AWS_REGION will gain from env variable.
AWS.config.update({region: config.AWS_REGION});
const {
  DEBUG
} = process.env;

AWS.config.logger = DEBUG ? console : null;

class Lambda {
  constructor() {
    /**
     * We don't need to pass AWS_LAMBDA_KEY,AWS_LAMBDA_SECRET because we use the grant of lambda role.
     */
    this.lambda = new AWS.Lambda({/*
      accessKeyId: config.AWS_LAMBDA_KEY,
      secretAccessKey: config.AWS_LAMBDA_SECRET,
     */});
  }

  /**
   * Invokes a lambda function
   *
   * @param functionName
   * @param payload
   * @param isAsync
   * @return {Promise<*>}
   */
  async invoke(functionName, payload, isAsync = false) {
    const params = {
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      LogType: 'None',
      Payload: JSON.stringify(payload),
    };

    if (isAsync) {
      params.InvocationType = 'Event';
      params.LogType = 'None'; // in case we change the default to 'Tail', this NEEDS to remain on None for async
    }

    return this.lambda
      .invoke(params)
      .promise()
      .then((response) => {
        // depending on the InvocationType, the success will have different codes
        const successCode = isAsync ? 202 : 200; //DryRun is 204

        if (successCode !== response.StatusCode) {
          logger.error(`Error from invoking lambda: ${functionName}, FunctionError=${response.FunctionError}`);
          throw new Error('Something wrong with server');
        }

        if (isAsync) return true; // we're done here, got our 202, let's move on

        const result = JSON.parse(response.Payload);
        if (result.errorMessage) {
          throw new Error(`Something wrong with server: ${result.errorMessage}`);
        }

        return result;
      });
  }
}


const {
  MEDIA_BUCKET = 'files.rnd',
} = process.env;


class S3 {
  constructor() {
    this.s3 = new AWS.S3({
      // accessKeyId: 'xxxx',
      // secretAccessKey: 'xxxxx',
    });
  }

  async upload(file) {
    let ext = null;
    let filename = null;
    let id = null;
    const fileData = file.data;

    switch (file.type) {
      case 'image/png':
        ext = '.png';
        break;
      case 'image/jpeg':
        ext = '.jpg';
        break;
      default:
        ext = '.txt';
        break;
    }

    if (ext) {
      id = tools.b16('hex');
      filename = id + ext;

      const params = {
        Bucket: MEDIA_BUCKET,
        Key: filename,
        Body: fileData,
        ContentType: file.type,
        ACL: 'public-read-write',
      };

      return this.s3.putObject(params)
        .promise()
        .then(() => ({
          id,
          ext,
          filename,
        }));
    } else {
      throw (new Error(`Incorrect mime type (${file.mimetype}).`));
    }
  }

  async delete(files) {
    files = Array.isArray(files) ? files : [files];
    if (!files.length) {
      return true;
    }

    const params = {
      Bucket: MEDIA_BUCKET,
      Delete: {
        Objects: files.map(({id, extension}) => ({Key: (id + extension)})),
        Quiet: false,
      },
    };

    await this.s3.deleteObjects(params).promise();

    return true;
  }
}

exports.lambda = new Lambda();
exports.s3 = new S3();
