from flask import Flask, render_template, request, redirect, url_for
import os
import json
import pandas as pd
import logging

app = Flask(__name__)

SETTINGS_FILE = "settings.json"

# Set up logging
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)


# Load settings
def load_settings():
    default_settings = {
        "books_dir": "",
        "annotations_csv": "annotations.csv",
        "books_per_page": 5,
        "files_per_page": 5,
        "states": "Front,Core,Back,Unknown",
        "metadata_csv": "",
        "mark_as_state": "Unknown",
    }

    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r") as f:
            loaded_settings = json.load(f)
            for key in default_settings:
                if key not in loaded_settings:
                    loaded_settings[key] = default_settings[key]
            return loaded_settings

    return default_settings


# Save settings
def save_settings(settings):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f)


settings = load_settings()

# Check if required settings are present
required_keys = [
    "books_dir",
    "annotations_csv",
    "books_per_page",
    "files_per_page",
    "states",
    "mark_as_state",
]


@app.before_request
def check_settings():
    if (
        not all(settings.get(key) for key in required_keys)
        and request.endpoint != "configure"
        and not request.path.startswith("/static/")
    ):
        return redirect(url_for("configure"))


# Load existing annotations
if os.path.exists(settings["annotations_csv"]):
    annotations_df = pd.read_csv(settings["annotations_csv"])
else:
    annotations_df = pd.DataFrame(columns=["ID", "Page", "State"])


# Save annotations
def save_annotations():
    annotations_df.to_csv(settings["annotations_csv"], index=False)


# Load metadata if provided
metadata_df = pd.DataFrame()


def load_metadata():
    global metadata_df
    metadata_df = pd.DataFrame()
    metadata_csv_path = settings.get("metadata_csv")
    if metadata_csv_path:
        logging.debug(f"Trying to read metadata from {metadata_csv_path}")
        if os.path.exists(metadata_csv_path):
            try:
                metadata_df = pd.read_csv(metadata_csv_path)
                logging.info(f"Metadata successfully loaded from {metadata_csv_path}")
            except Exception as e:
                logging.error(f"Error reading metadata CSV: {e}")
        else:
            logging.warning(f"Metadata CSV not found at {metadata_csv_path}")


@app.context_processor
def utility_processor():
    return dict(all=all, settings=settings, int=int, max=max, min=min)


@app.route("/settings", methods=["GET", "POST"])
def configure():
    if request.method == "POST":
        settings["books_dir"] = request.form["books_dir"]
        settings["annotations_csv"] = request.form["annotations_csv"]
        settings["books_per_page"] = int(request.form["books_per_page"])
        settings["files_per_page"] = int(request.form["files_per_page"])
        settings["states"] = request.form["states"]
        settings["metadata_csv"] = request.form["metadata_csv"]
        settings["mark_as_state"] = request.form["mark_as_state"]
        save_settings(settings)
        load_metadata()  # Load metadata after saving settings
        return redirect(url_for("index"))

    return render_template("settings.html", settings=settings)


@app.route("/")
def index():
    if not all(settings.get(key) for key in required_keys):
        return redirect(url_for("configure"))

    books = os.listdir(settings["books_dir"])
    books_per_page = settings["books_per_page"]  # Number of books per page
    page = request.args.get("page", 1, type=int)
    start_index = (page - 1) * books_per_page
    end_index = start_index + books_per_page
    paginated_books = books[start_index:end_index]

    book_completion = {}
    book_metadata = {}

    for book in paginated_books:
        book_path = os.path.join(settings["books_dir"], book)
        total_pages = len(os.listdir(book_path))
        annotated_pages = annotations_df[annotations_df["ID"] == book].shape[0]
        completion = (annotated_pages / total_pages) * 100 if total_pages > 0 else 0
        book_completion[book] = round(completion, 2)

        # Get metadata if available
        metadata = None
        if not metadata_df.empty:
            if "htid" in metadata_df.columns:
                metadata = metadata_df[metadata_df["htid"] == book]
            elif "htid_old" in metadata_df.columns:
                metadata = metadata_df[metadata_df["htid_old"] == book]

            if metadata is not None and not metadata.empty:
                book_metadata[book] = {
                    "title": metadata["title"].values[0][:10],
                    "author": metadata["author"].values[0],
                }

    total_books = len(books)
    total_pages = (
        total_books + books_per_page - 1
    ) // books_per_page  # Calculate total pages

    return render_template(
        "index.html",
        books=paginated_books,
        book_completion=book_completion,
        book_metadata=book_metadata,
        page=page,
        total_pages=total_pages,
    )


@app.route("/book/<book_id>", methods=["GET", "POST"])
def book(book_id):
    global annotations_df

    if request.method == "POST":
        if "mark_as_state" in request.form:
            mark_as_state = request.form["mark_as_state"]
            book_path = os.path.join(settings["books_dir"], book_id)
            pages = sorted(os.listdir(book_path))

            for page_file in pages:
                page = page_file  # Keep the .txt extension
                if annotations_df[
                    (annotations_df["ID"] == book_id) & (annotations_df["Page"] == page)
                ].empty:
                    new_annotation = pd.DataFrame(
                        {"ID": [book_id], "Page": [page], "State": [mark_as_state]}
                    )
                    annotations_df = pd.concat(
                        [annotations_df, new_annotation], ignore_index=True
                    )

            save_annotations()
            logging.debug(
                f"Marked all unannotated pages as {mark_as_state} for book {book_id}"
            )
            return redirect(
                url_for("book", book_id=book_id, page=request.args.get("page", 1))
            )

        else:
            page = request.form["page"]
            state = request.form["state"]

            # Check if the current state is the same as the clicked button to remove the annotation
            if annotations_df[
                (annotations_df["ID"] == book_id)
                & (annotations_df["Page"] == page)
                & (annotations_df["State"] == state)
            ].empty:
                # Add the new annotation
                new_annotation = pd.DataFrame(
                    {"ID": [book_id], "Page": [page], "State": [state]}
                )
                annotations_df = pd.concat(
                    [annotations_df, new_annotation], ignore_index=True
                )
            else:
                # Remove the existing annotation
                annotations_df = annotations_df[
                    (annotations_df["ID"] != book_id)
                    | (annotations_df["Page"] != page)
                    | (annotations_df["State"] != state)
                ]

            save_annotations()
            logging.debug(
                f"Toggled annotation for page {page} as {state} for book {book_id}"
            )
            return redirect(
                url_for("book", book_id=book_id, page=request.args.get("page", 1))
            )

    page = int(request.args.get("page", 1))
    book_path = os.path.join(settings["books_dir"], book_id)
    pages = sorted(os.listdir(book_path))
    total_files_per_page = settings["files_per_page"]
    total_pages = (len(pages) + total_files_per_page - 1) // total_files_per_page
    start_index = (page - 1) * total_files_per_page
    end_index = start_index + total_files_per_page
    pages_to_display = pages[start_index:end_index]

    content = []
    for page_file in pages_to_display:
        with open(os.path.join(book_path, page_file), "r", encoding="utf-8") as file:
            content.append((page_file, file.read()))

    next_page = page + 1 if (page + 1) <= total_pages else None
    prev_page = page - 1 if page > 1 else None

    logging.debug(f"Displaying pages: {pages_to_display}")

    annotations_dict = (
        annotations_df[annotations_df["ID"] == book_id]
        .set_index("Page")
        .to_dict()["State"]
    )

    logging.debug(f"Annotations for book {book_id}: {annotations_dict}")

    # Split the states string by comma
    states = [state.strip() for state in settings["states"].split(",")]

    metadata = None
    if not metadata_df.empty:
        book_metadata = None
        if "htid" in metadata_df.columns:
            book_metadata = metadata_df[metadata_df["htid"] == book_id]
        elif "htid_old" in metadata_df.columns:
            book_metadata = metadata_df[metadata_df["htid_old"] == book_id]

        if book_metadata is not None and not book_metadata.empty:
            rights_date = book_metadata["rights_date_used"].values[0]
            if pd.isna(rights_date):
                rights_date = ""
            else:
                rights_date = (
                    str(int(rights_date))
                    if rights_date.is_integer()
                    else str(rights_date)
                )
            metadata = {
                "title": book_metadata["title"].values[0],
                "author": book_metadata["author"].values[0],
                "rights_date_used": rights_date,
            }

    annotated_pages = annotations_df[annotations_df["ID"] == book_id].shape[0]
    book_completion = (annotated_pages / len(pages)) * 100 if len(pages) > 0 else 0

    return render_template(
        "book.html",
        book_id=book_id,
        content=content,
        next_page=next_page,
        prev_page=prev_page,
        annotations=annotations_dict,
        states=states,
        metadata=metadata,
        book_completion=round(book_completion, 2),
        total_pages=total_pages,
        page=page,
        mark_as_state=settings["mark_as_state"],
    )


@app.route("/annotations", methods=["GET"])
def get_annotations():
    return annotations_df.to_csv(index=False)


if __name__ == "__main__":
    app.run(debug=True)
