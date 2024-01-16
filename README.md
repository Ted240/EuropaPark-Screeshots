# EUROPA PARK - Attractions screenshots

---
## Description
Rest api to generate custom screenshots bases on players positions and name

---
## API Documentation
Script expose a given port (see configuration), calling endpoint will return JSON formatted data.
Access can be locked down if needed, you will need to give a token during fetch process to authenticate.
Token can be passed has an `authorization` header or with a `authorization: <TOKEN>` statement in payload.

## Config file
<details>
  <summary>File structure</summary>

  ```
{
    auth: {
        enable,
        token_file
        hashing: {
            enable,
            salt
        }
    },
    files: {
        save,
        save_duration,
        save_number,
        save_weight
    },
    server: {
        port,
        fake_404
    }
}
  ```
| Added |       Argument        |  Type   | Description                                                                                                                               |
|:-----:|:---------------------:|:-------:|-------------------------------------------------------------------------------------------------------------------------------------------|
|   ✖   |     `auth.enable`     | boolean | `true` to activate authentication process                                                                                                 |
|   ✖   |   `auth.token_file`   | string  | Path to file containing auth tokens                                                                                                       |
|   ✖   | `auth.hashing.enable` | boolean | `true` to declare tokens as hashed, tokens must be stored as hashed                                                                       |
|   ✖   |  `auth.hashing.salt`  | integer | Hashing salt level                                                                                                                        |
|   ✖   |     `files.save`      | boolean | Specify if generated images are saved as files, else they are stored in memory. If script is restarted, images are permanently lost       |
|   ✖   | `files.save_duration` | integer | Specify how long are saved images in days                                                                                                 |
|   ✖   |  `files.save_number`  | integer | Specify how many images are stored at the same time                                                                                       |
|   ✖   |  `files.save_weight`  | integer | Specify maximum total weight of images in MB                                                                                              |
|   ✔   |     `server.port`     | integer | HTTP Server port                                                                                                                          |
|   ✖   |   `server.fake_404`   | boolean | On protected images, if bad token is sent, return `404 - Image not found` error instead of `403 - Bad token`. Prevent token brute-forcing |



</details>

## API Endpoints
<details><summary> <b>API status</b> </summary>
Give API state.
Auth token is not required.

**Endpoint:** `/status`

**Payload:**<br>
*Empty*

**Response:**

| Code |       JSON       | Description                                 |
|:----:|:----------------:|---------------------------------------------|
| 200  | `{state: ready}` | API is ready to receive and generate images |
</details>

<details><summary> <b>Generate image</b> </summary>
Generate image of listed players in given situation.

**Endpoint:** `/generate`

**Payload:**<br>

```
{
    protected,
    camera,
    async,
    players: [
        {
            name || uuid,
            pos
        }, ...
    ]
}
```
**Args**

|    Argument    | Req |  Type   | Description                                                                                                                      |
|:--------------:|:---:|:-------:|----------------------------------------------------------------------------------------------------------------------------------|
|  `protected`   |  ✖  | boolean | True if image token must be required to view (default: `True`)                                                                   |
|    `camera`    |  ✔  | string  | Camera identifier, used to determined what source image will be used as base                                                     |
| `players.name` |  ✔  | string  | Player name, used to grab skin                                                                                                   |
| `players.uuid` |  ✔  | string  | Player UUID, used to grab skin. Must be preferred over `players.name`                                                            |
| `players.pos`  |  ✔  | integer | Player position index                                                                                                            |

**Response:**

| Code |              JSON              | Description                          |
|:----:|:------------------------------:|--------------------------------------|
| 200  |  `{id: <ID>, token: <TOKEN>}`  | Return generated image id with token |
| 404  | `{error: "Player not found"}`  | Unable to find player skin           |
| 404  |  `{error: "Base not found"}`   | Unable to find the base image        |
| 404  | `{error: "Overlay not found"}` | Unable to find the overlay image     |
</details>

<details><summary> <b>View image</b> </summary>
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
</details>

## Services used
- Pseudo to UUID translate: **[Mojang API](https://api.mojang.com)**<br>
`https://api.mojang.com/users/profiles/minecraft/{NAME}`


- UUID to skin texture: **Mojang Session**<br>
`https://sessionserver.mojang.com/session/minecraft/profile/{UUID}`

