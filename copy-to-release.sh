SOURCE_FOLDER=./
DEST_FOLDER=./releases/

rm -rf releases
mkdir -p releases
rsync -avzh --exclude-from "./rsync-exclude-list.txt" \
	--progress $SOURCE_FOLDER $DEST_FOLDER
