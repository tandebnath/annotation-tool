from flask import Flask, render_template, request, redirect, url_for
import os
import json
import pandas as pd

app = Flask(__name__)

SETTINGS_FILE = "settings.json"


# Load settings
def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    return {
        "books_dir": "",
        "annotations_csv": "annotations.csv",
        "files_per_page": 5,
        "states": "Front, Core, Back, Unknown",
        "metadata_csv": "",
    }


# Save settings
def save_settings(settings):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f)


settings = load_settings()

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
if settings.get("metadata_csv") and os.path.exists(settings["metadata_csv"]):
    metadata_df = pd.read_csv(settings["metadata_csv"])


@app.context_processor
def utility_processor():
    return dict(all=all, settings=settings, int=int, max=max, min=min)


@app.route("/settings", methods=["GET", "POST"])
def configure():
    if request.method == "POST":
        settings["books_dir"] = request.form["books_dir"]
        settings["annotations_csv"] = request.form["annotations_csv"]
        settings["files_per_page"] = int(request.form["files_per_page"])
        settings["states"] = request.form["states"]
        settings["metadata_csv"] = request.form["metadata_csv"]
        save_settings(settings)
        return redirect(url_for("index"))

    return render_template("settings.html", settings=settings)


@app.route("/")
def index():
    if not all(settings.values()):
        return redirect(url_for("configure"))

    books = os.listdir(settings["books_dir"])
    books_per_page = 5  # Number of books per page
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
        if not metadata_df.empty and "htid" in metadata_df.columns:
            metadata = metadata_df[metadata_df["htid"] == book]
            if not metadata.empty:
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
    if request.method == "POST":
        page = request.form["page"]
        state = request.form["state"]

        # Remove any existing annotation for this page
        global annotations_df
        annotations_df = annotations_df[
            (annotations_df["ID"] != book_id) | (annotations_df["Page"] != page)
        ]

        # Add the new annotation
        new_annotation = pd.DataFrame(
            {"ID": [book_id], "Page": [page], "State": [state]}
        )
        annotations_df = pd.concat([annotations_df, new_annotation], ignore_index=True)

        # Save annotations
        save_annotations()

        return redirect(
            url_for("book", book_id=book_id, page=request.args.get("page", 0))
        )

    page = int(request.args.get("page", 1))
    book_path = os.path.join(settings["books_dir"], book_id)
    pages = sorted(os.listdir(book_path))
    total_files_per_page = settings["files_per_page"]
    total_pages = (
        len(pages) + total_files_per_page - 1
    ) // total_files_per_page  # Calculate total pages
    start_index = page * total_files_per_page
    end_index = start_index + total_files_per_page
    pages_to_display = pages[start_index:end_index]

    content = []
    for page_file in pages_to_display:
        with open(os.path.join(book_path, page_file), "r", encoding="utf-8") as file:
            content.append((page_file, file.read()))

    next_page = page + 1 if (page + 1) < total_pages else None
    prev_page = page - 1 if page > 0 else None

    annotations_dict = (
        annotations_df[annotations_df["ID"] == book_id]
        .set_index("Page")
        .to_dict()["State"]
    )
    states = settings["states"].split(",")

    # Get metadata if available
    metadata = None
    if not metadata_df.empty and "htid" in metadata_df.columns:
        book_metadata = metadata_df[metadata_df["htid"] == book_id]
        if not book_metadata.empty:
            metadata = {
                "title": book_metadata["title"].values[0],
                "author": book_metadata["author"].values[0],
                "rights_date_used": book_metadata["rights_date_used"].values[0],
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
    )


@app.route("/annotations", methods=["GET"])
def get_annotations():
    return annotations_df.to_csv(index=False)


if __name__ == "__main__":
    app.run(debug=True)
