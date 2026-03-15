
#!/bin/bash
# ==========================================
# Deploy Assembly Script
# ==========================================
# Usage: ./deploy-assembly.sh <CONTAINER_ID> <ASSEMBLY_NAME>
# Example: ./deploy-assembly.sh gs_123_25565 survival_1.16.5.zip

CONTAINER_ID=$1
ASSEMBLY_NAME=$2
ASSEMBLY_DIR="/opt/wexa/assemblies"

if [ -z "$CONTAINER_ID" ] || [ -z "$ASSEMBLY_NAME" ]; then
    echo "Usage: $0 <CONTAINER_ID> <ASSEMBLY_NAME>"
    exit 1
fi

ASSEMBLY_PATH="$ASSEMBLY_DIR/$ASSEMBLY_NAME"

if [ ! -f "$ASSEMBLY_PATH" ]; then
    echo "Error: Assembly file not found at $ASSEMBLY_PATH"
    exit 1
fi

echo "Deploying assembly $ASSEMBLY_NAME to container $CONTAINER_ID..."

# Check if container is running
if ! docker ps -q -f id=$CONTAINER_ID > /dev/null; then
    if ! docker ps -aq -f id=$CONTAINER_ID > /dev/null; then
        echo "Error: Container not found"
        exit 1
    else
        echo "Container is stopped. Starting temporarily to copy files..."
        docker start $CONTAINER_ID
    fi
fi

# Create temp dir
TEMP_DIR=$(mktemp -d)
echo "Extracting assembly to $TEMP_DIR..."

if [[ "$ASSEMBLY_NAME" == *.zip ]]; then
    unzip -q "$ASSEMBLY_PATH" -d "$TEMP_DIR"
elif [[ "$ASSEMBLY_NAME" == *.tar.gz ]]; then
    tar -xzf "$ASSEMBLY_PATH" -C "$TEMP_DIR"
else
    echo "Error: Unsupported archive format. Use .zip or .tar.gz"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Copy files to container volume (/data is standard for itzg/minecraft-server)
echo "Copying files to container /data..."
docker cp "$TEMP_DIR/." "$CONTAINER_ID:/data/"

# Cleanup
rm -rf "$TEMP_DIR"

# Fix permissions inside container (minecraft user usually uid 1000)
docker exec -u 0 "$CONTAINER_ID" chown -R 1000:1000 /data

echo "Assembly deployed successfully!"
