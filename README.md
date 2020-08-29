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

`pm2 start ecosystem.config.js`

`pm2 log`

## Setup Virtual Host Confs for openLitespeed
### Set the correct root directory
https://s8.gifyu.com/images/vhost_basic.png

https://s8.gifyu.com/images/vhost_general.png

### Add Anime-Server as an external app 
https://s8.gifyu.com/images/vhost_external_app.png

### Configure Routing for static file serving
https://s8.gifyu.com/images/vhost_context.png

https://s8.gifyu.com/images/vhost_context_exapanded.png

## Tune Server for large file serving
https://s8.gifyu.com/images/server_tuning.png

## Enable SSL(if you have domain)
yum install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm

yum install certbot

Edit virtual host config to open up folder .well-known

Finish certbot setup

Enter ssl certificate into virtual host config

https://s8.gifyu.com/images/vhost_ssl.png

Test to see if https works, by going to https://{SERVER_IP}/

### Forward all traffic to HTTPS
https://s8.gifyu.com/images/vhost_rewrite.png

rewriteCond %{HTTPS} !on

rewriteCond %{HTTP:X-Forwarded-Proto} !https

rewriteRule ^(.*)$ https://%{SERVER_NAME}%{REQUEST_URI} [R,L]

