const aws = require('../shared/aws');

async function testLambda() {
	try {
		// NOTED: I assume we already created a lambda function named serverless-practice-staging-server-info
    const result = await aws.lambda.invoke('serverless-practice-staging-server-info');

		return result;
  } catch (error) {
    console.error('createFileOnS3 failed');
    console.error(error);

    throw error;
  }
}

module.exports = {
	testLambda,
};
