### why nvm?

node version manager -- now this will handle node fifferently for diff projects as req

### why docker

images concurent run

### why package-lock.json

fixed kinda stuff, in package.json ^X.Y.Z so kinda ranges but in this fixed -> It solves working in my system not urs bug

### 401 vs 403

401 = “Who are you?”; 403 = “You can’t do that.”

## HTTP concepts

### Request methods

| Method | What it does                                                             | Safe? | Idempotent? |
| ------ | ------------------------------------------------------------------------ | ----- | ----------- |
| GET    | Reads a resource without asking the server to change it.                 | Yes   | Yes         |
| POST   | Sends data for the server to process, often creating something new.      | No    | No          |
| PUT    | Creates or replaces the resource at the given URL with the request data. | No    | Yes         |
| PATCH  | Applies changes to part of an existing resource.                         | No    | Usually no  |
| DELETE | Requests that the server remove the resource.                            | No    | Yes         |

Safe means the request doesn't change server data. Idempotent means repeating
the same request leaves the server in the same state as doing it once. A PATCH
can be idempotent depending on the change it describes, but isn't guaranteed to
be.

### Response status codes

| Status | Meaning                                                       | When your API returns it                                                 |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 200    | The request succeeded.                                        | A read or update succeeded and there is a response to return.            |
| 201    | A resource was created.                                       | A create request successfully made a new resource.                       |
| 204    | The request succeeded, with no response body.                 | An update or delete succeeded and there is nothing to return.            |
| 400    | The request is invalid or malformed.                          | The request can't be understood, such as when required input is missing. |
| 401    | Valid authentication wasn't provided.                         | The caller needs to sign in or provide valid credentials.                |
| 403    | The caller isn't allowed to do this.                          | The caller is known but lacks permission for the action.                 |
| 404    | The requested resource or route wasn't found.                 | The requested item doesn't exist or the endpoint is unknown.             |
| 409    | The request conflicts with the current state.                 | Creating or changing a resource would conflict with existing data.       |
| 422    | The request is understood but its content can't be processed. | The input is well-formed but fails a validation or business rule.        |
| 500    | The server hit an unexpected error.                           | Something failed inside the API while handling a valid request.          |

### Headers and request data

- **Content-Type:** Says what format the request or response body uses, such as JSON.
- **Accept:** Tells the server which response formats the client can handle.
- **Authorization:** Carries credentials or a token the server uses to identify the caller.
- **Path params:** Values in the URL path that identify a particular resource, such as `/expenses/42`.
- **Query params:** Optional URL values after `?` that filter or adjust a request, such as `/expenses?month=10`.
- **Body:** Data sent with a request, commonly JSON when creating or updating a resource.

### Zod

Our Zod expense schema strips unknown body fields by default instead of rejecting
the request; for example, an extra `hacker` field is ignored and not stored.
