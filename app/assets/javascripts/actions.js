/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 22/11/12
 * Time: 1.13
 * To change this template use File | Settings | File Templates.
 */

//NOTE: This file depends on globals defined in env3d.js

function __colorObjects(objects, colorHex)
{
    for (var i = 0; i < objects.length; i++)
    {
        objects[i].traverse(function (obj)
        {
            if (obj instanceof THREE.Mesh)
            {
                if (obj.material instanceof THREE.MeshFaceMaterial)
                {
                   var  faceMaterials = obj.material.materials;
                   for (var i = 0; i < faceMaterials.length; i++)
                   {
                        faceMaterials[i].color = new THREE.Color(colorHex);
                   }
                }
                else
                    obj.material.color = new THREE.Color(colorHex);
            }
        });
    }
}
function __highlightObjects(objects)
{
    __colorObjects(objects, 0xFF0000);
}

function __deHighlightObjects(objects)
{
    __colorObjects(objects, 0xFFFFFF);
}

function clearBookHighlight()
{
    if (__highlightedBook)
    {
        __highlightedBook.object.parent.position.z -= 5;
        __highlightedBook = null;
    }
}

function highlightBook(bookIndex)
{
    if (__zoomedBook)
        return;

    var pickRes = __pickBookByIndex(bookIndex);

    if (!__highlightedBook || (__highlightedBook.object != pickRes.object))
    {
//        if (__highlightedBook) __deHighlightObjects([__highlightedBook.object]);
//        __highlightObjects([pickRes.object]);
//        __highlightedBook = pickRes;
        if (__highlightedBook) __highlightedBook.object.position.z -= 5;
        pickRes.object.parent.position.z += 5;
        __highlightedBook = pickRes;

    }
}

function __doUnZoomCurrentBook()
{
    if (__zoomedBook)
    {
        __zoomedBook.model.parent.position = __zoomedBook.position.clone();
        __zoomedBook.model.parent.rotation = __zoomedBook.rotation.clone();
        __zoomedBook.model.parent.updateMatrixWorld();
        $("#div_books_table #" + __zoomedBook.index + " #zoom_on_book").show();
        $("#div_books_table #" + __zoomedBook.index + " #div_book_details").remove();
        __zoomedBook = null;
    }
}

function zoomOnBook(bookIndex)
{
    clearBookHighlight();

    __doUnZoomCurrentBook();

    if (!__zoomedShelf)
    {
        $("#div_render_viewport").append(buildHTMLBackButton());
    }

    var pickRes = __pickBookByIndex(bookIndex);

    var models = jQuery.extend([], env3d_model_books[pickRes.bookcaseIndex][pickRes.shelfIndex]);//clone the array of books
    models.push(env3d_model_shelves[pickRes.bookcaseIndex][pickRes.shelfIndex]);

    if (!__zoomedShelf)
    {
        var bbox = computeMeshesBBox(models);

        var w = Math.abs(bbox.max.x - bbox.min.x);
        var h = Math.abs(bbox.max.y - bbox.min.y);

        bbox.min.x -= w / 20;
        bbox.min.y -= h / 20;
        bbox.max.x += w / 20;
        bbox.max.y += h / 20;

        smartPlaceCamera(env3d_camera, bbox);
    }
    __zoomedShelf = {objects:models}
    __zoomedBook = {model:pickRes.object,
                    position:pickRes.object.parent.position.clone(),
                    rotation:pickRes.object.parent.rotation.clone(),
                    index:bookIndex};

    __moveInFrontOfCamera(__zoomedBook.model);

    html = buildHTMLForBookDetailsInTable(bookIndex, __books_entries[bookIndex]);
    $("#div_books_table #" + bookIndex).append(html);
    $("#div_books_table #" + bookIndex + " #zoom_on_book").hide();
}

function unZoom()
{
    if (__zoomedBook)
    {
        //place the book back on the shelf
        __doUnZoomCurrentBook();

        //zoom on the shelf
        bbox = computeMeshesBBox(__zoomedShelf.objects);

        var w = Math.abs(bbox.max.x - bbox.min.x);
        var h = Math.abs(bbox.max.y - bbox.min.y);

        bbox.min.x -= w / 20;
        bbox.min.y -= h / 20;
        bbox.max.x += w / 20;
        bbox.max.y += h / 20;

        smartPlaceCamera(env3d_camera, bbox);
    }
    else if (__zoomedShelf)
    {
        __zoomedShelf = null;
        zoomOnBookcases();
        $("#button_unZoom").remove();
    }
}

//function highlightBook(bookIndex)
//{
//    var bookModel = findBookModelByIndex(bookIndex, env3d_model_books);
//    if (bookModel)
//    {
//        //      bookModel.material.color = new THREE.Color(0xFF0000);
//        env3d_highlighted_model = bookModel;
//        bookPosition = env3d_model_environment.worldToLocal(bookModel.matrixWorld.getPosition().clone());
//        env3d_camera.position = bookPosition;
//        env3d_camera.position.z += 30;
//        env3d_camera.lookAt(bookPosition);
//    }
//    else
//    {
//        console.log("Book model not found at index:" + bookIndex);
//    }
//}

function __doDehighlightBookcase(bookcaseModel)
{
    for (var i = 0; i < bookcaseModel.children.length; i++)
    {
        if (bookcaseModel.children[i] instanceof THREE.Mesh)
            bookcaseModel.children[i].material.color = new THREE.Color(0xFFFFFF);
    }
}

function __doHighlightBookcase(bookcaseModel)
{
    for (var i = 0; i < bookcaseModel.children.length; i++)
    {
        if (bookcaseModel.children[i] instanceof THREE.Mesh)
            bookcaseModel.children[i].material.color = new THREE.Color(0xFF0000);
    }
}

function __moveInFrontOfCamera(model)
{
    var worldCameraPos = env3d_model_environment.localToWorld(env3d_camera.position.clone());
    //worldCameraPos.z  -= 15;
    model.parent.position = model.parent.parent.worldToLocal(worldCameraPos);
    model.parent.position.z -=15;
    //model.rotation.y = 90;
}