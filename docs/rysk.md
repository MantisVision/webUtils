# RYSK
This a combination of @mantisvision/rysk* packages into one bundle. It exposes RYSKUrl and RYSKStream objects as 
properties of the export. 

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/rysk
npm install @mantisvision/rysk
```

## Usage:
You can use this library in the following way:
```javascript
import { RYSKUrl, RYSKStream } from "@mantisvision/rysk";

const ryskUrl = new RYSKUrl("video_url","data_url");
const ryskStream = new RYSKStream(MediaStream);
```

## Public API:
Desscription of APIs can be found [here](./rskurlryskstream.md);