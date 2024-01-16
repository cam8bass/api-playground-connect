import mongoose, { Query, Document } from "mongoose";

interface QueryRequest {
  sort?: string;
  fields?: string;
  page?: string;
  limit?: string;
  search?: string;
}

class FilterQuery<T extends Document> {
  public queryMethod: Query<T[], T>;
  private queryRequest: QueryRequest;
  constructor(queryMethod: Query<Array<T>, T>, queryRequest: QueryRequest) {
    (this.queryMethod = queryMethod), (this.queryRequest = queryRequest);
  }

  filter() {
    const objectQuery = { ...this.queryRequest };
    const excludeQuery = ["sort", "fields", "page", "limit", "search"];
    excludeQuery.forEach((el) => delete objectQuery[el]);
    const queryString = JSON.parse(
      JSON.stringify(objectQuery).replace(
        /\b(gte|gt|lte|lt)\b/,
        (match) => `$${match}`
      )
    );

    this.queryMethod.find(queryString);
    return this;
  }

  search() {
    if (this.queryRequest.search) {
      const search = this.queryRequest.search;

      const searchConditions = [
        { firstname: new RegExp(search, "i") },
        { lastname: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        searchConditions.push({
          _id: new mongoose.Types.ObjectId(search) as any,
        } as any);
      }
      this.queryMethod.find({ $or: searchConditions });
    }
    return this;
  }

  fields() {
    if (this.queryRequest.fields) {
      const fields = JSON.parse(
        JSON.stringify(this.queryRequest.fields).split(",").join(" ")
      );
      this.queryMethod.select(fields);
    } else {
      this.queryMethod.select("-__v");
    }
    return this;
  }

  sort() {
    if (this.queryRequest.sort) {
      const sortBy = this.queryRequest.sort.split(",");

      const sortObject = sortBy.reduce(
        (obj: Record<string, 1 | -1>, field: string) => {
          if (field.startsWith("-")) {
            obj[field.substring(1)] = -1;
          } else {
            obj[field] = 1;
          }
          return obj;
        },
        {}
      );

      this.queryMethod.sort({ ...sortObject, _id: 1 });
    } else {
      this.queryMethod.sort({ _id: 1, createAt: -1 });
    }
    return this;
  }

  page() {
    const page = parseInt(this.queryRequest.page) || 1;
    const limit = parseInt(this.queryRequest.limit) || 10;

    const skip = (page - 1) * limit;
    this.queryMethod.skip(skip).limit(limit);
    return this;
  }
}

export default FilterQuery;

// class FilterQuery {
//   public queryMethod: Query<any, any>;
//   private queryRequest: Record<string, any>;
//   constructor(queryMethod: Query<any, any>, queryRequest: Record<string, any>) {
//     (this.queryMethod = queryMethod), (this.queryRequest = queryRequest);
//   }

//   filter() {
//     const objectQuery = { ...this.queryRequest };
//     const excludeQuery = ["sort", "fields", "page", "limit", "search"];
//     excludeQuery.forEach((el) => delete objectQuery[el]);
//     const queryString = JSON.parse(
//       JSON.stringify(objectQuery).replace(
//         /\b(gte|gt|lte|lt)\b/,
//         (match) => `$${match}`
//       )
//     );

//     this.queryMethod.find(queryString);
//     return this;
//   }

//   search() {
//     if (this.queryRequest.search) {
//       const search = this.queryRequest.search;

//       const searchConditions = [
//         { firstname: new RegExp(search, "i") },
//         { lastname: new RegExp(search, "i") },
//         { email: new RegExp(search, "i") },
//       ];

//       if (mongoose.Types.ObjectId.isValid(search)) {
//         searchConditions.push({
//           _id: new mongoose.Types.ObjectId(search) as any,
//         } as any);
//       }
//       this.queryMethod.find({ $or: searchConditions });
//     }
//     return this;
//   }

//   fields() {
//     if (this.queryRequest.fields) {
//       const fields = JSON.parse(
//         JSON.stringify(this.queryRequest.fields).split(",").join(" ")
//       );
//       this.queryMethod.select(fields);
//     } else {
//       this.queryMethod.select("-__v");
//     }
//     return this;
//   }

//   sort() {
//     if (this.queryRequest.sort) {
//       const sortBy = this.queryRequest.sort.split(",");

//       const sortObject = sortBy.reduce(
//         (obj: Record<string, 1 | -1>, field: string) => {
//           if (field.startsWith("-")) {
//             obj[field.substring(1)] = -1;
//           } else {
//             obj[field] = 1;
//           }
//           return obj;
//         },
//         {}
//       );

//       this.queryMethod.sort({ ...sortObject, _id: 1 });
//     } else {
//       this.queryMethod.sort({ _id: 1, createAt: -1 });
//     }
//     return this;
//   }

//   page() {
//     const page = parseInt(this.queryRequest.page) || 1;
//     const limit = parseInt(this.queryRequest.limit) || 10;

//     const skip = (page - 1) * limit;
//     this.queryMethod.skip(skip).limit(limit);
//     return this;
//   }
// }

// export default FilterQuery;
