/* eslint-disable max-classes-per-file */

import { MongoClient, Db } from "mongodb";

type Constructor<T = {}> = new (...args: any[]) => T;

const collection = () => <T extends Constructor>(Base: T) => {
  class Collection extends Base {

  }

  return Collection;
};

// // use either objectId or uuid
// // modify get/set to return string (nicer to work with)
// const id = (options = {}) => (target: Object, propertyName: string) => {

// };

// // validation: bson types, custom
// const field = (options = {}) => (target: any, propertyName: string) => {

//   // property value
//   let _val = target[propertyName];

//   // property getter method
//   const getter = () => {
//     console.log(`Get: ${propertyName} => ${_val}`);
//     return _val;
//   };

//   // property setter method
//   // do validation here
//   const setter = (newVal: any) => {
//     console.log(`Set: ${propertyName} => ${newVal}`);
//     _val = newVal;
//   };

//   // Delete property.
//   // eslint-disable-next-line no-param-reassign
//   if (delete target[propertyName]) {
//     // Create new property with getter and setter
//     Object.defineProperty(target, propertyName, {
//       get: getter,
//       set: setter,
//       enumerable: true,
//       configurable: true,
//     });
//   }
// };

// const ref = (options = {}) => (target: Object, propertyName: string) => {

// };

interface IBaseModel {
  _id: object;
  __v: number;
}

@collection()
class BaseModel implements IBaseModel {
  _id!: object;

  __v!: number;
}

//
const connect = async (): Promise<MongoClient> => {
  const client = await MongoClient.connect("mongodb://localhost:27017", {
    useUnifiedTopology: true,
  });

  // temp
  console.log("connected to mongo");

  return client;
};

(async (): Promise<void> => {
  await connect();
})();

// Database<Collection>.find({});
