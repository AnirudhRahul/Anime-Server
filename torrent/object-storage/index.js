// S3 Initilization
const S3 = require('aws-sdk/clients/s3');
const AWS = require('aws-sdk');
const path = require('path')
require('dotenv').config({path: path.resolve(__dirname, '.env')})
const endpoint = new AWS.Endpoint(process.env.AWS_Endpoint);
const region = process.env.AWS_Region
const accessKeyId = process.env.AWS_accessKeyId
const secretAccessKey = process.env.AWS_secretAccessKey
const bucket = process.env.AWS_Bucket

const s3 = new S3({
  endpoint: endpoint,
  region: region,
  accessKeyId,
  secretAccessKey
});

const fs = require('fs')
exports.upload = (metadata) => new Promise((resolve, reject) => {
  //Save the path to all the uploaded files so we can delete them later
  const uploadedFiles = []
  uploadFile(metadata.thumbnail_path, 'image/png')
  .then((link) => {
    uploadedFiles.push(metadata.thumbnail_path)
    metadata.thumbnail_path = link
  })
  .then(() => {
    if('subtitle_path' in metadata)
      return uploadFile(metadata.subtitle_path, 'text/plain')
    else
      return false
  })
  .then((res) => {
    if(res){
      uploadedFiles.push(metadata.subtitle_path)
      metadata.subtitle_path = res
    }
  })
  .then(() => {
    let mimeType = 'video/mp4'
    if(metadata.video_path.endsWith('.mkv') || metadata.video_path.endsWith('.webm')){
      mimeType='video/webm'
    }
    return uploadFile(metadata.video_path, mimeType, metadata)
  })
  .then((link) => {
    uploadedFiles.push(metadata.video_path)
    metadata.video_path = link
    for(file of uploadedFiles)
      fs.unlinkSync(file)
    console.log("Finished uploading files")
    resolve(metadata)
  })
  .catch(reject)
})

function uploadFile(file_path, mimeType, metadata){
  let formatted_metadata = {}
  if(metadata){
    formatted_metadata = {metadata: JSON.stringify(metadata)}
  }
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Key: path.basename(file_path),
      Body: fs.createReadStream(file_path),
      ContentType: mimeType,
      Metadata: formatted_metadata,
    };
    const options = {partSize: 10 * 1024 * 1024, queueSize: 20}
    s3.upload(params, options, function(err, data) {
      if(err)
        reject(err)
      else
        resolve(data.Location)
    });
  })

}
