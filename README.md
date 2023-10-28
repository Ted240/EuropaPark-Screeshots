# EUROPA PARK - Attractions screenshots

---
## Description
Rest api to generate custom screenshots bases on player position (indexed for now) and name

---
## API Documentation
Script expose a given port (see configuration), calling endpoint will return JSON formatted data.
Access can be locked down if needed, you will need to give a token during fetch process to authenticate.
Token can be passed has an `Authentication` header or with an `token: <TOKEN>` statement in payload.

## API Endpoints
- ### API Status
Give API state

**Endpoint:** `/status`

**Payload:**<br>
*Empty*

**Response:**

| Code |       JSON       | Description                                 |
|:----:|:----------------:|---------------------------------------------|
| 200  | `{state: ready}` | API is ready to receive and generate images |

- ### Generate Image
Generate image of listed players

**Endpoint:** `/generate`

**Payload:**<br>

```
{
    protected,
    camera,
    players: [
        {
            name || uuid,
            pos
        }, ...
    ]
}
```
**Args**

|    Argument    | Req |  Type   | Description                                                                  |
|:--------------:|:---:|:-------:|------------------------------------------------------------------------------|
|  `protected`   |  ✖  | boolean | True if image token must be required to view (default: True)                 |
|    `camera`    |  ✔  | string  | Camera identifier, used to determined what source image will be used as base |
| `players.name` |  ✔  | string  | Player name, used to grab skin                                               |
| `players.uuid` |  ✔  | string  | Player UUID, used to grab skin. Must be preferred over `players.name`        |
| `players.pos`  |  ✔  | integer | Player position index                                                        |

**Response:**

| Code |              JSON              | Description                          |
|:----:|:------------------------------:|--------------------------------------|
| 200  |  `{id: <ID>, token: <TOKEN>}`  | Return generated image id with token |
| 404  | `{error: "Player not found"}`  | Unable to find player skin           |
| 404  |  `{error: "Base not found"}`   | Unable to find the base image        |
| 404  | `{error: "Overlay not found"}` | Unable to find the overlay image     |

- ### View Image
Return generated image.
Auth token is not required.

**Endpoint:** `/view`

**Payload:**<br>
GET Request: `/view?id=<ID>&token=<TOKEN>`
```
{
    id,
    token
}
```
**Args**

| Argument |  Type   | Description                                 |
|:--------:|:-------:|---------------------------------------------|
|   `id`   | integer | (Can be passed as query) Requested image id |
| `token`  | string  | (Can be passed as query) Image view token   |

**Response:**

| Code |             JSON             | Description                  |
|:----:|:----------------------------:|------------------------------|
| 200  |             `{}`             | Return generated image       |
| 403  |  `{error: "Invalid token"}`  | Given image token is invalid |
| 404  | `{error: "Image not found"}` | Unable to find image asked   |

## Credits
- Pseudo to UUID translate: [Mojang API](https://api.mojang.com)<br>`https://api.mojang.com/users/profiles/minecraft/{NAME}`
- UUID to skin texture: [Crafatar.com](https://crafatar.com/)<br>`https://crafatar.com/skins/{UUID}`
