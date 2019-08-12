const aws = require('../shared/aws');

async function testS3() {
	try {
    const file = await aws.s3.upload({
      type: 'text/plain',
      filename: `test-policy-${new Date()}`,
      data: Buffer.from(new Date().toISOString(), 'utf8'),
    });

    const {id, ext: extension} = file;
    await aws.s3.delete({id, extension});
  } catch (error) {
    console.error('createFileOnS3 failed');
    console.error(error);

    throw error;
  }
}

module.exports = {
	testS3,
};
