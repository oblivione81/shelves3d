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

    }
    else
    {
        //Zoom on shelf

        if (__highlightedShelf)
            __deHighlightObjects(__highlightedShelf.objects);
        __zoomedShelf = __highlightedShelf;
        __highlightedShelf = null;

        bbox = computeMeshesBBox(__zoomedShelf.objects);

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