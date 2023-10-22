# EUROPA PARK - Attraction screenshots

---
## Description
Rest api to generate custom screenshots bases on player position (indexed for now) and name

---
## API Documentation
Script expose a given port (see configuration), calling endpoint will return JSON formatted data and time.
Response will be formatted as follows:
```json
{
  "data": "<DATA/ERROR>", 
  "time": "<TIME>"
}
```
Access can be locked down if needed, you will need to give a token during fetch process to authenticate.
Token can be passed has an `Authentication` header or with an `token: <TOKEN>` statement in payload.

## API Endpoints
- ### API Status
**Endpoint:** `/status`

**Payload:**<br>
```json
{}
```

**Response:**

| Code |       JSON       | Description                                 |
|:----:|:----------------:|---------------------------------------------|
| 200  | `{state: ready}` | API is ready to receive and generate images |

- ### Generate Image
**Endpoint:** `/generate`

**Payload:**<br>

```json
{
  "protected?": "<TRUE IF RETURN ADDITIONAL TOKEN TO VIEW (DEF: FALSE)>",
  "source": "<IMAGE TO PROCESS ON>",
  "players": [
    {
      "name": "<PLAYER NAME>",
      "pos": "<POSITION INDEX>"
    }
  ]
}
```

**Response:**

| Code |              JSON              | Description                                      |
|:----:|:------------------------------:|--------------------------------------------------|
| 200  |          `{id: <ID>}`          | Return generated image id                        |
| 200  |  `{id: <ID>, token: <TOKEN>}`  | Return generated image id in addition of a token |
| 404  | `{error: "Player not found"}`  | Enable to find player skin                       |
| 404  |  `{error: "Base not found"}`   | Enable to find the base image                    |
| 404  | `{error: "Overlay not found"}` | Enable to find the overlay image                 |
