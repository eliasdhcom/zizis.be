![logo](https://eliasdh.com/assets/media/images/logo-github.png)
# 💙🤍DOCKER🤍💙

## 📘Table of Contents

1. [📘Table of Contents](#📘table-of-contents)
2. [🚀Docker](#🚀docker)
    - [🚀Frontend](#🚀frontend)
    - [🚀Backend](#🚀backend)

## 🚀Docker

### 🚀Frontend
- Pull the latest image and run the container
```bash
sudo docker pull ghcr.io/eliasdhcom/zizisbe-frontend:latest
sudo docker run --name zizisbe-frontend-container -p 8080:8080 -d ghcr.io/eliasdhcom/zizisbe-frontend:latest
```

- Check the logs
```bash
sudo docker logs zizisbe-frontend-container
```

- Stop and remove the existing container and image
```bash
sudo docker stop zizisbe-frontend-container
sudo docker rm zizisbe-frontend-container
sudo docker rmi ghcr.io/eliasdhcom/zizisbe-frontend:latest
```

### 🚀Backend
```bash
sudo docker pull ghcr.io/eliasdhcom/zizisbe-backend:latest
sudo docker run --name zizisbe-backend-container -p 3000:3000 -d ghcr.io/eliasdhcom/zizisbe-backend:latest
```

- Check the logs
```bash
sudo docker logs zizisbe-backend-container
```

- Stop and remove the existing container and image
```bash
sudo docker stop zizisbe-backend-container
sudo docker rm zizisbe-backend-container
sudo docker rmi ghcr.io/eliasdhcom/zizisbe-backend:latest
```