# Anime-Server
Basic server to download and serve anime

# Setup Instructions

Below is a complete list of commands and settings you can run to get this server up and running on a server with OpenLiteSpeed.
Note this has been tested on a Vultr instance using the OpenLiteSpeed CentOS 7 system image, so some instructions will not work on other operating systems.

# Navigate to OpenLiteSpeed directory
cd /usr/local/lsws/Example/

rm -rf cgi-bin fcgi-bin

## Install latest version of git
`sudo yum remove git*`

`sudo yum -y install https://packages.endpoint.com/rhel/7/os/x86_64/endpoint-repo-1.7-1.x86_64.rpm`

`sudo yum install git`

(Hit y to accept download)

`git clone https://github.com/AnirudhRahul/Anime-Server.git`

`curl -sL https://rpm.nodesource.com/setup_12.x | sudo bash -`

`sudo yum install -y nodejs`

`node -v`

`cd Anime-Server/`

`npm install`

`npm install pm2 -g`

`pm2 --version`

# Install ffmpeg
`sudo yum install epel-release`

`sudo yum localinstall --nogpgcheck https://download1.rpmfusion.org/free/el/rpmfusion-free-release-7.noarch.rpm`

`sudo yum install ffmpeg ffmpeg-devel`

`ffmpeg -version`

# Configure S3
Make sure to add a .env file with the following attributes, in the `torrent/object-storage/` dir:
```
AWS_accessKeyId=SECRET
AWS_secretAccessKey=SECRET
AWS_Endpoint=s3.us-east-2.wasabisys.com
AWS_Region=us-east-2
AWS_Bucket=aniserve-dev(can pick any bucket name just make sure it exists)
```


# Start torrenter

`pm2 start ecosystem.config.js`

`pm2 log`

## Setup Virtual Host Confs for openLitespeed
### Set the correct root directory
https://s8.gifyu.com/images/vhost_general.png

### Add Anime-Server as an external app 
https://s8.gifyu.com/images/vhost_external_app.png

### Configure Routing for static file serving
https://s8.gifyu.com/images/vhost_context.png

https://s8.gifyu.com/images/vhost_context_exapanded.png

https://s8.gifyu.com/images/vhost_app_routing.png

## General Server-wide Settings
### Tune Server for large file serving
Go to Server Configuration > Tuning

https://s8.gifyu.com/images/server_tuning.png

### Configure MIME types
Server Configuration > General

Click on conf/mime.properties

Add the following MIME types
| Suffixes      | Type             |
| ------------- |:----------------:|
| wasm          | application/wasm |


## Enable SSL(if you have domain)
`yum install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm`

`yum install certbot`

`mkdir /usr/local/lsws/Example/.well-known/`

## Finish certbot setup

1. `certbot certonly`

2. Select option 2

3. Enter your email

4. Press `A` to agree

5. Press Y or N if you want to get additional emails

6. Enter your domain name(required to setup ssl)

7. Enter `/usr/local/lsws/Example/` as your webroot



Enter ssl certificate into virtual host config

https://s8.gifyu.com/images/vhost_ssl.png

Private Key File: `/etc/letsencrypt/live/DOMAIN_NAME/privkey.pem`

Certificate File: `/etc/letsencrypt/live/DOMAIN_NAME/fullchain.pem`

Select yes for chained certificate

Test to see if https works, by going to https://{DOMAIN_NAME}/

### Forward all traffic to HTTPS
https://www.question-defense.com/2008/08/20/how-to-redirect-all-litespeed-http-traffic-to-https#:~:text=Login%20to%20the%20Litespeed%20web,from%20the%20sub%20top%20navifation.
