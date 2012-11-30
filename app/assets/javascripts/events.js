/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 26/11/12
 * Time: 13.25
 * To change this template use File | Settings | File Templates.
 */
//= require env3d
//= require utils

var __zoomedShelf = null; //{bookcaseIndex: .., shelfIndex:..};
var __highlightedShelf = null; //{bookcaseIndex:.., shelfIndex:..};
var __zoomedBook = null; //{model:.., position:.., rotation:..}
var __highlightedBook = null; //{bookcaseIndex:.., shelfIndex:.., model:..}


function __onDocumentMouseMove( event )
{
    event.preventDefault();

    var pos = fromScreenToRenderer(new THREE.Vector2(event.clientX, event.clientY), "canvas_render_viewport");

    if (__zoomedShelf)
    {
        //pick a book
        var pickedBook = __pickBook(pos.x, pos.y);

        if (!pickedBook ||
            !__highlightedBook ||
            pickedBook.bookIndex != __highlightedBook.bookIndex)
        {
            if (__highlightedBook)
                clearBookHighlight();

            if (pickedBook)
                highlightBook(pickedBook.bookIndex);
        }
    }
    else
    {
        //pick a shelf
        var pickedShelf = __pickShelf(pos.x, pos.y);

        if (!pickedShelf ||
            !__highlightedShelf ||
            (pickedShelf.bookcaseIndex != __highlightedShelf.bookcaseIndex
                && pickedShelf.shelfIndex != __highlightedShelf.shelfIndex))
        {
            if (pickedShelf)
            {
                __highlightObjects(pickedShelf.objects);
            }

            if (__highlightedShelf)
            {
                __deHighlightObjects(__highlightedShelf.objects);
            }

            __highlightedShelf = pickedShelf;
        }
    }
}

function __onDocumentMouseDown(event)
{
    if (__zoomedShelf)
    {
        if (__highlightedBook)
        {
            zoomOnBook(__highlightedBook.bookIndex);
        }
    }
    else if (__highlightedShelf)
    {
        //Zoom on shelf

            __deHighlightObjects(__highlightedShelf.objects);
        __zoomedShelf = __highlightedShelf;
        __highlightedShelf = null;

        var objectsToZoom = jQuery.extend([], __zoomedShelf.objects);
        objectsToZoom.push(env3d_model_shelves[__zoomedShelf.bookcaseIndex][__zoomedShelf.shelfIndex])
        bbox = computeMeshesBBox(objectsToZoom);

        //env3d_model_bookcases[__zoomedShelf.bookcaseIndex].localToWorld(bbox.min);
        //env3d_model_bookcases[__zoomedShelf.bookcaseIndex].localToWorld(bbox.max);
        var w = Math.abs(bbox.max.x - bbox.min.x);
        var h = Math.abs(bbox.max.y - bbox.min.y);

        bbox.min.x -= w / 20;
        bbox.min.y -= h / 20;
        bbox.max.x += w / 20;
        bbox.max.y += h / 20;

        smartPlaceCamera(env3d_camera, bbox);
        $("#div_render_viewport").append(buildHTMLBackButton());
    }
}

function buildHTMLBackButton()
{
    var html = "<button id='button_unZoom' onclick='unZoom();'>Back</button>";
    return html;
}