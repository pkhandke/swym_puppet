# Introduction

The Swym Puppet Runs Validations Based on the documentation here.
Currently only works for BISPA - However we will scale it to wishlist.
https://docs.google.com/document/d/1-VfdIkUEn43TtL5f4NriQGtgIbtdnMVFNKY4FhbGepE

# Setup Steps.
Requirements - 
 
 1. Clone this repository in from git to a local folder in your pc.
 2. Setup Node JS and NPM  - (If you don't already have it).
 3. Run npm install on the cloned directory.
 4. Use ``` npm run dev`` to run the BOT

# Running the BOT
When runing the bot for the first time run npm install on the directory.
1. ```npm install```

2. open shopify_stores.csv in a csv editor / numbers app and add your store urls without changing the header column.

3. run the command ```npm run dev`` on your terminal on the cloned folder and the bot should start processing the urls.


That's it - It should validate each store and will generate a file called  *results.csv* file which will contain all the viable store urls.



