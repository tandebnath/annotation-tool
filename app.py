from flask import Flask, render_template, request, redirect, url_for, flash
import os
import json
import pandas as pd
import logging

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Generates a random secret key

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
        "volume_notes_csv": "volume_notes.csv",
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
    "volume_notes_csv",
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
    try:
        if not os.path.exists(settings["annotations_csv"]):
            annotations_df.to_csv(settings["annotations_csv"], index=False)
        else:
            annotations_df.to_csv(
                settings["annotations_csv"], mode="a", header=False, index=False
            )
    except PermissionError:
        flash(
            "You have the Annotations CSV file open in another application. Please close it before continuing to run this app.",
            "error",
        )


def load_volume_notes():
    if os.path.exists(settings["volume_notes_csv"]):
        return pd.read_csv(settings["volume_notes_csv"])
    return pd.DataFrame(columns=["ID", "Notes"])


def save_volume_notes(volume_notes_df):
    try:
        volume_notes_df.to_csv(settings["volume_notes_csv"], index=False)
    except PermissionError:
        flash(
            "You have the Volume Notes CSV file open in another application. Please close it before continuing to run this app.",
            "error",
        )


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
        settings["volume_notes_csv"] = request.form["volume_notes_csv"]
        save_settings(settings)
        load_metadata()  # Load metadata after saving settings
        return redirect(url_for("index"))

    return render_template("settings.html", settings=settings)


@app.route("/", methods=["GET", "POST"])
def index():
    if not all(settings.get(key) for key in required_keys):
        return redirect(url_for("configure"))

    # Get the search query
    search_query = request.args.get("search", "").lower()

    books = [
        book
        for book in os.listdir(settings["books_dir"])
        if os.path.isdir(os.path.join(settings["books_dir"], book))
        and any(
            file.endswith(".txt")
            for file in os.listdir(os.path.join(settings["books_dir"], book))
        )
    ]

    # Sort books
    books.sort()

    book_metadata = {}
    book_completion = {}

    for book in books:
        book_path = os.path.join(settings["books_dir"], book)
        total_pages = len(
            [file for file in os.listdir(book_path) if file.endswith(".txt")]
        )
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
                title = (
                    metadata["title"].values[0] if "title" in metadata.columns else ""
                )
                author = (
                    metadata["author"].values[0] if "author" in metadata.columns else ""
                )
                book_metadata[book] = {
                    "title": title,
                    "author": author,
                }
            else:
                logging.warning(f"No valid metadata found for book {book}")

    # Filter books by search query
    if search_query:
        books = [
            book
            for book in books
            if (
                search_query in book.lower()
                or (
                    book in book_metadata
                    and search_query in book_metadata[book]["title"].lower()
                )
                or (
                    book in book_metadata
                    and search_query in book_metadata[book]["author"].lower()
                )
            )
        ]

    books_per_page = settings["books_per_page"]  # Number of books per page
    page = request.args.get("page", 1, type=int)
    start_index = (page - 1) * books_per_page
    end_index = start_index + books_per_page
    paginated_books = books[start_index:end_index]

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
        search_query=search_query,
    )


@app.route("/book/<book_id>", methods=["GET", "POST"])
def book(book_id):
    global annotations_df
    volume_notes_df = load_volume_notes()

    if request.method == "POST":
        action = request.form.get("action")
        if action == "save":
            notes = request.form["volume_notes"]

            # Remove any existing notes for this volume
            volume_notes_df = volume_notes_df[volume_notes_df["ID"] != book_id]

            # Add the new notes if not empty
            if notes.strip():
                new_notes = pd.DataFrame({"ID": [book_id], "Notes": [notes]})
                volume_notes_df = pd.concat(
                    [volume_notes_df, new_notes], ignore_index=True
                )

            save_volume_notes(volume_notes_df)

        elif action == "clear":
            volume_notes_df = volume_notes_df[volume_notes_df["ID"] != book_id]
            save_volume_notes(volume_notes_df)

        elif action == "range_annotation":
            from_page = int(request.form["from_page"])
            to_page = int(request.form["to_page"])
            range_state = request.form["range_state"]

            book_path = os.path.join(settings["books_dir"], book_id)
            pages = sorted(os.listdir(book_path))
            for page_file in pages[from_page - 1 : to_page]:
                page = page_file
                current_annotation = annotations_df[
                    (annotations_df["ID"] == book_id) & (annotations_df["Page"] == page)
                ]
                if current_annotation.empty:
                    new_annotation = pd.DataFrame(
                        {"ID": [book_id], "Page": [page], "State": [range_state]}
                    )
                    annotations_df = pd.concat(
                        [annotations_df, new_annotation], ignore_index=True
                    )
                else:
                    annotations_df.loc[
                        (annotations_df["ID"] == book_id)
                        & (annotations_df["Page"] == page),
                        "State",
                    ] = range_state

            save_annotations()

        elif request.form.get("jump_to_unannotated"):
            book_path = os.path.join(settings["books_dir"], book_id)
            pages = sorted(os.listdir(book_path))
            unannotated_pages = [
                page
                for page in pages
                if annotations_df[
                    (annotations_df["ID"] == book_id) & (annotations_df["Page"] == page)
                ].empty
            ]

            if unannotated_pages:
                first_unannotated_page_index = pages.index(unannotated_pages[0]) + 1
                total_files_per_page = settings["files_per_page"]
                page_number = (
                    first_unannotated_page_index + total_files_per_page - 1
                ) // total_files_per_page
                return redirect(url_for("book", book_id=book_id, page=page_number))

        else:
            page = request.form.get("page")
            state = request.form.get("state")

            if page and state:
                current_annotation = annotations_df[
                    (annotations_df["ID"] == book_id) & (annotations_df["Page"] == page)
                ]

                if current_annotation.empty:
                    # Add the new annotation
                    new_annotation = pd.DataFrame(
                        {"ID": [book_id], "Page": [page], "State": [state]}
                    )
                    annotations_df = pd.concat(
                        [annotations_df, new_annotation], ignore_index=True
                    )
                else:
                    current_state = current_annotation["State"].values[0]
                    if current_state == state:
                        # Remove the existing annotation
                        annotations_df = annotations_df[
                            (annotations_df["ID"] != book_id)
                            | (annotations_df["Page"] != page)
                        ]
                    else:
                        # Update to the new state
                        annotations_df.loc[
                            (annotations_df["ID"] == book_id)
                            & (annotations_df["Page"] == page),
                            "State",
                        ] = state

                save_annotations()

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

    annotations_dict = (
        annotations_df[annotations_df["ID"] == book_id]
        .set_index("Page")
        .to_dict()["State"]
    )

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
            title = (
                book_metadata["title"].values[0]
                if "title" in book_metadata.columns
                else ""
            )
            author = (
                book_metadata["author"].values[0]
                if "author" in book_metadata.columns
                else ""
            )
            rights_date = ""

            if "date" in book_metadata.columns:
                rights_date = book_metadata["date"].values[0]
            elif "rights_date_used" in book_metadata.columns:
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
                "title": title,
                "author": author,
                "rights_date_used": rights_date,
            }
            logging.info(f"Metadata for book {book_id}: {metadata}")
        else:
            logging.warning(f"No valid metadata found for book {book_id}")

    annotated_pages = annotations_df[annotations_df["ID"] == book_id].shape[0]
    book_completion = (annotated_pages / len(pages)) * 100 if len(pages) > 0 else 0

    # Get existing volume notes if available
    volume_notes = volume_notes_df[volume_notes_df["ID"] == book_id]["Notes"]
    if not volume_notes.empty:
        volume_notes = volume_notes.values[0]
    else:
        volume_notes = ""

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
        volume_notes=volume_notes,
    )


if __name__ == "__main__":
    app.run(debug=True)
