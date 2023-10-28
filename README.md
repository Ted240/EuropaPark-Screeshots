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
  "data": "[Object]<DATA/ERROR>", 
  "time": "[float]<TIME>"
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
  "protected?": "[bool]<TRUE IF RETURN ADDITIONAL TOKEN TO VIEW (DEF: FALSE)>",
  "source": "[str]<IMAGE TO PROCESS ON>",
  "players": [
    {
      "name": "[str]<PLAYER NAME>",
      "pos": "[int]<POSITION INDEX>"
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

- ### View Image
**Endpoint:** `/view?id=[int]<IMAGE ID>&token?=[str]<OPTIONAL TOKEN>`

**Payload:**<br>

```json
{}
```

**Response:**

| Code |              JSON              | Description                      |
|:----:|:------------------------------:|----------------------------------|
| 200  |              `{}`              | Return generated image id        |
| 404  |  `{error: "Image not found"}`  | Enable to find image asked       |
