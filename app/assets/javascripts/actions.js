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
                obj.material.color = new THREE.Color(colorHex);
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
        __highlightedBook.object.position.z -= 5;
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
        pickRes.object.position.z += 5;
        __highlightedBook = pickRes;

    }

}

function zoomOnBook(bookIndex)
{
    clearBookHighlight();

    if (__zoomedBook)
    {
        __zoomedBook.model.position = __zoomedBook.position;
        __zoomedBook.model.rotation = __zoomedBook.rotation;
        __zoomedBook.model.updateMatrixWorld();
    }

    if (!__zoomedShelf)
    {
        $("#div_render_viewport").append(buildHTMLBackButton());
    }

    var pickRes = __pickBookByIndex(bookIndex);

    var models = jQuery.extend([], env3d_model_books[pickRes.bookcaseIndex][pickRes.shelfIndex]);//clone the array of books
    models.push(env3d_model_shelves[pickRes.bookcaseIndex][pickRes.shelfIndex]);

    var bbox = computeMeshesBBox(models);

    var w = Math.abs(bbox.max.x - bbox.min.x);
    var h = Math.abs(bbox.max.y - bbox.min.y);

    bbox.min.x -= w / 20;
    bbox.min.y -= h / 20;
    bbox.max.x += w / 20;
    bbox.max.y += h / 20;

    smartPlaceCamera(env3d_camera, bbox);

    __zoomedShelf = pickRes;
    __zoomedBook = {model:pickRes.object,
                    position:pickRes.object.position.clone(),
                    rotation:pickRes.object.rotation.clone()};

    __moveInFrontOfCamera(__zoomedBook.model);
}

function unZoom()
{
    if (__zoomedBook)
    {
        //place the book back on the shelf
        __zoomedBook.model.position = __zoomedBook.position;
        __zoomedBook.model.rotation = __zoomedBook.rotation;
        __zoomedBook.model.updateMatrixWorld();
        __zoomedBook = null;

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
        var bBox = computeObjectsBBox(env3d_model_bookcases);
        smartPlaceCamera(env3d_camera, bBox);
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
    worldCameraPos.z  -= 15;
    model.position = model.worldToLocal(worldCameraPos);
    model.rotation.y = 90;
}