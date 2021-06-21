// S3 Initilization
const S3 = require('aws-sdk/clients/s3');
const AWS = require('aws-sdk');
const path = require('path')
require('dotenv').config({path: path.resolve(__dirname, '.env')})
if(!(process.env.AWS_Endpoint &&
  process.env.AWS_Region &&
  process.env.AWS_accessKeyId &&
  process.env.AWS_secretAccessKey &&
  process.env.AWS_Bucket)){
  console.error("Please make sure you have created your .env file in Anime-Server/torrent/object-store\nCheck the ReadME for more info", )
  process.exit(9)
}

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
exports.upload = function(metadata){
  //Save the path to all the uploaded files so we can delete them later
  uploadFile(metadata.thumbnail_path, 'image/png')
  .then((link) => {
    metadata.thumbnail_path = link
  })
  .then(() => {
    const promise_list = []
    // Upload all subtitle files
    for(const index in metadata.subtitle_path){
      const old_path = metadata.subtitle_path[index].path
      // Delete path because we don't want to save that metadata to object storage
      delete metadata.subtitle_path[index].path

      promise_list.push(
        uploadFile(old_path, 'text/plain', metadata.subtitle_path[index])
        .then((link)=>{
          metadata.subtitle_path[index].path = link
        })
      )
    }

    return Promise.all(promise_list)
  })
  .then(() => {
    let mimeType = 'video/mp4'
    if(metadata.video_path.endsWith('.mkv') || metadata.video_path.endsWith('.webm')){
      mimeType='video/webm'
    }
    return uploadFile(metadata.video_path, mimeType, metadata)
  })
  .then((link) => {
    metadata.video_path = link
    console.log("Finished uploading files")
    // console.log(metadata)
    return metadata
  })
}

function uploadFile(file_path, mimeType, metadata){
  let formatted_metadata = {}
  if(metadata){
    const copy = Object.assign({}, metadata);
    if('subtitle_path' in copy)
      delete copy.subtitle_path
    formatted_metadata = {metadata: JSON.stringify(copy)}
  }

  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucket,
      Key: path.basename(file_path),
      Body: fs.createReadStream(file_path),
      ContentType: mimeType,
      Metadata: formatted_metadata,
    };
    const options = {partSize: 8 * 1024 * 1024, queueSize: 10}
    s3.upload(params, options, function(err, data) {
      if(err)
        return reject(err)
      else{
        fs.unlinkSync(file_path)
        return resolve(data.Location)
      }
    });
  })

}
