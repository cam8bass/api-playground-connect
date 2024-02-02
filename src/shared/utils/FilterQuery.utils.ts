import mongoose, { Query, Document } from "mongoose";

interface QueryRequest {
  sort?: string;
  fields?: string;
  page?: string;
  limit?: string;
  search?: string;
}

export class FilterQuery<T extends Document> {
  public queryMethod: Query<T[], T>;
  private queryRequest: QueryRequest;
  constructor(queryMethod: Query<Array<T>, T>, queryRequest: QueryRequest) {
    (this.queryMethod = queryMethod), (this.queryRequest = queryRequest);
  }

  /**
   * Filters the query based on the query parameters
   * @param {Object} queryRequest - The query parameters
   * @param {string} [queryRequest.sort] - The fields to sort by
   * @param {string} [queryRequest.fields] - The fields to return
   * @param {string} [queryRequest.page] - The page number
   * @param {string} [queryRequest.limit] - The number of results per page
   * @param {string} [queryRequest.search] - The search query
   */
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

  /**
   * Filters the query based on the query parameters
   * @param {Object} queryRequest - The query parameters
   * @param {string} [queryRequest.sort] - The fields to sort by
   * @param {string} [queryRequest.fields] - The fields to return
   * @param {string} [queryRequest.page] - The page number
   * @param {string} [queryRequest.limit] - The number of results per page
   * @param {string} [queryRequest.search] - The search query
   */
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

  /**
   * Filters the query based on the query parameters
   * @param {Object} queryRequest - The query parameters
   * @param {string} [queryRequest.sort] - The fields to sort by
   * @param {string} [queryRequest.fields] - The fields to return
   * @param {string} [queryRequest.page] - The page number
   * @param {string} [queryRequest.limit] - The number of results per page
   * @param {string} [queryRequest.search] - The search query
   */
  fields() {
    if (this.queryRequest.fields) {
      const fields = JSON.parse(
        JSON.stringify(this.queryRequest.fields).split(",").join(" ")
      );
      // Selects the specified fields to return from the query.
      this.queryMethod.select(fields);
    } else {
      // Selects all fields except the version key (__v) from the query.
      this.queryMethod.select("-__v");
    }
    return this;
  }

  /**
   * Filters the query based on the query parameters
   * @param {Object} queryRequest - The query parameters
   * @param {string} [queryRequest.sort] - The fields to sort by
   * @param {string} [queryRequest.fields] - The fields to return
   * @param {string} [queryRequest.page] - The page number
   * @param {string} [queryRequest.limit] - The number of results per page
   * @param {string} [queryRequest.search] - The search query
   */
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
      this.queryMethod.sort({ _id: 1, createdAt: -1 });
    }
    return this;
  }

  /**
   * Filters the query based on the query parameters
   * @param {Object} queryRequest - The query parameters
   * @param {string} [queryRequest.sort] - The fields to sort by
   * @param {string} [queryRequest.fields] - The fields to return
   * @param {string} [queryRequest.page] - The page number
   * @param {string} [queryRequest.limit] - The number of results per page
   * @param {string} [queryRequest.search] - The search query
   */
  page() {
    const page = parseInt(this.queryRequest.page) || 1;
    const limit = parseInt(this.queryRequest.limit) || 10;

    const skip = (page - 1) * limit;
    this.queryMethod.skip(skip).limit(limit);
    return this;
  }
}


