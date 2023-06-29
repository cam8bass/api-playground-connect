import { Query } from "mongoose";

class FilterQuery {
  public queryMethod: Query<any, any>;
  private queryRequest: Record<string, any>;
  constructor(queryMethod: Query<any, any>, queryRequest: Record<string, any>) {
    (this.queryMethod = queryMethod), (this.queryRequest = queryRequest);
  }

  filter() {
    const objectQuery = { ...this.queryRequest };
    const excludeQuery = ["sort", "fields", "page", "limit"];
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
      const sortBy = JSON.parse(
        JSON.stringify(this.queryRequest.sort).split(",").join(" ")
      );
      this.queryMethod.sort(sortBy);
    } else {
      this.queryMethod.sort("-createAt");
    }
    return this;
  }

  page() {
    const page = +this.queryRequest.page || 1;
    const limit = +this.queryRequest.limit || 50;
    const skip = (page - 1) * limit;
    this.queryMethod.skip(skip).limit(limit);
    return this;
  }
}

export default FilterQuery;
