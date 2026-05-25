# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build

# Stage 2: Build .NET backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app
COPY src/AmcVoucherManager/*.csproj ./
RUN dotnet restore
COPY src/AmcVoucherManager/ ./
RUN dotnet publish -c Release -o /publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN mkdir -p /data

COPY --from=backend-build /publish .
COPY --from=frontend-build /AmcVoucherManager/wwwroot ./wwwroot

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_FORWARDEDHEADERS_ENABLED=true
ENV DataDirectory=/data

EXPOSE 5000

VOLUME ["/data"]

ENTRYPOINT ["dotnet", "AmcVoucherManager.dll"]
