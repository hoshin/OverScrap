A lot of effort has been put into `faker.js` to create a useful and handy
library. There are still a lot of things to be done, so all contributions are
welcome! If you can make `faker.js` better, please read the following contribution guide.

# Important

* Please make sure that you run at least `npm build` and `npm test` before making a PR.
* New functionality should be unit tested (at least the most basic cases)

## Support
When in doubt, do not hesitate to look at existing issues / create an issue of your own if need be.

## Automation

* The project is being built by [babel](https://babeljs.io). CLI tools destination directory is [bin](bin), JS lies in [dist](dist)
* The tests are executing `mocha` against `*.Spec.js` files of [test](test) directory

## Architecture

Server sources are located in the [server](server) directory. Main lib is at the root of the repo right now.
