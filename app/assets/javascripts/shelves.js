/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 22/11/12
 * Time: 0.54
 * To change this template use File | Settings | File Templates.
 */

var shelvesEntries = null;
var currentShelfIndex = null;
var __books_entries = [];

function changeShelf(shelfIndex)
{
    getShelf(shelvesEntries[shelfIndex].id);
    $("#span_shelves_selector_name").html(shelvesEntries[shelfIndex].name);
    currentShelfIndex = shelfIndex;
}

function prevShelf()
{
    var i = (currentShelfIndex + (shelvesEntries.length - 1)) % shelvesEntries.length;
    changeShelf(i);
}

function nextShelf()
{
    var i = (currentShelfIndex + 1) % shelvesEntries.length;
    changeShelf(i);
}

function placeOnABookcase(bookcaseModel, booksEntries, shelvesModels, booksModels)
{
    var node = null;
    var index = 0;

    do
    {
        node = bookcaseModel.getChildByName("sh" + index, true);
        if (node)
        {
            node.castShadow = true;
            node.receiveShadow = true;
            shelvesModels.push(node);
            booksModels.push(new Array)
        }
        index++;
    }while(node && index < 100 /*sanity check!*/);

    if (shelvesModels.length > 0)
        return placeOnShelves(booksEntries, shelvesModels, booksModels);
    else
        return 0;
}

function placeOnShelves(booksEntries, shelvesModels, booksModels)
{
    var from_index = 0;
    var shelf_index = 0;

    while (from_index < booksEntries.length && shelf_index < shelvesModels.length)
    {
        from_index = placeOnAShelve(booksEntries, shelvesModels[shelf_index], from_index, booksModels[shelf_index]);
        shelf_index++;
    }

    return from_index;
}

var currentRequestId = 0;

function __createLoadTextureCB(book, requestId)
{
    return function(texture)
    {
        if (currentRequestId != requestId)
            return;
        var ratio = texture.image.width / texture.image.height;

        var geom = book.children[0].geometry;
        geom.computeBoundingBox();

        var bookHeight = Math.abs(geom.boundingBox.max.y -
                                    geom.boundingBox.min.y);

        var bookWidth = Math.abs(geom.boundingBox.max.z -
            geom.boundingBox.min.z);

        var realWidth = bookHeight * ratio;

        book.children[0].scale.z = realWidth / bookWidth ;
    }
}

//books_entries: array of {book_title, book_num_pages, book_image_url}
function placeOnAShelve(booksEntries, shelveNode, fromIndex, booksModels)
{
    var offset = 0;
    var temp_max_books = 23;

    for (var i = 0; i < temp_max_books && fromIndex + i < booksEntries.length; i++)
    {
        var abs_index = fromIndex + i;
        if (shelveNode.geometry)
        {
            var pages = booksEntries[abs_index].num_pages;

            var book_size =  pages * 5 / 350;
            book_size *= (1 / Math.log(pages));

            var book_height = [6.5, 7, 7.5][booksEntries[abs_index].num_pages % 3];
            var geo = new THREE.CubeGeometry(book_size, book_height, 6);


            c = random_color();
            var book = new THREE.Object3D;
            book.castShadow = true;

            var texture = THREE.ImageUtils.loadTexture
                (
                    "/home/proxy?url=" + booksEntries[abs_index].image_url,
                    {},
                    __createLoadTextureCB(book, currentRequestId)
                );


            //var mat = new THREE.MeshBasicMaterial({color : colorToHex(c[0], c[1], c[2])});
            geo.materials = [new THREE.MeshLambertMaterial({/*color : colorToHex(c[0], c[1], c[2]),*/ map: texture}),
                                new THREE.MeshLambertMaterial({map: env3d_texture_pages})];
            geo.faces[0].materialIndex = 0;
            geo.faces[1].materialIndex = 0;
            geo.faces[2].materialIndex = 1;//no
            geo.faces[3].materialIndex = 1;//no
            geo.faces[4].materialIndex = 0;
            geo.faces[5].materialIndex = 1;//no

            var bookMesh = new THREE.Mesh(geo, new THREE.MeshFaceMaterial());

            book.add(bookMesh);
            book.name = "b"+ abs_index;
            book.position.x = offset + shelveNode.position.x + book_size / 2;
            book.position.y = shelveNode.position.y + book_height / 2.0;
            book.position.z = shelveNode.position.z - 4;

            var bookcase = shelveNode.parent;
            bookcase.add(book);
            booksModels.push(bookMesh);

            offset += book_size;
        }
    }
    return fromIndex + i;
}

// booksModels is a list of buckets of models of books (the bookcases).
function findBookModelByIndex(bookIndex, booksModels)
{
    var firstIndexOfCase = 0;
    for (var caseIndex = 0; caseIndex < booksModels.length; caseIndex++)
    {
        var modelsOfCurrentCase = booksModels[caseIndex];
        if (bookIndex < firstIndexOfCase + modelsOfCurrentCase.length)
        {
            return modelsOfCurrentCase[bookIndex - firstIndexOfCase];
        }
        firstIndexOfCase += modelsOfCurrentCase.length;
    }
    return null;
}

function intersectBookcase(ray, model)
{
    for (var i = 0; i < model.children.length; i++)
    {
        if (ray.intersectObject(model.children[i]).length > 0)
            return true;
    }
    return false;
}

function buildHtmlForBookInTable(row, book)
{
    var bookLinkGR = "http://www.goodreads.com/book/show/" + book.id;

    var html='';
    html += '<div onmouseout="clearBookHighlight();" onmouseover="highlightBook('+ row + ');" class="book_entry" id="' + row + '">';
    html +=     '<div class="title">' + book.title + '</div>';
    html +=     '<div class="author">' + book.author_name + '</div>';
    html +=     '<span class="icons_list_left">';
    html +=         '<a href="' + bookLinkGR  + '"><img class="small_icon" src="../gr_icon.jpg"/></a>';
    html +=     '</span>';
    html +=     '<span id="zoom_on_book">';
    html +=         '<img onclick="zoomOnBook('+ row + ');" class="small_icon" src="../lens.png"/>';
    html +=     '</span>';
    html += '</div>';

    return html;
}

function buildHTMLForBookDetailsInTable(row, book)
{
    var html='';
    html += '<div id="div_book_details">';
    html +=     '<div id="details">';
    html +=         '<div><span class="key">Pages:</span>' + '<span class="value">' + book.num_pages +'</span></div>'
    html +=         '<div><span class="key">Avg. Rating:</span>' + '<span class="value">' + book.avg_rating+'</span></div>'
    html +=     '</div>';

    html +=     '<div>';
    html +=         '<span><img src="/home/proxy?url='+ encodeURIComponent(book.author_image_url) + '"/></span>';
    html +=         '<span>' + book.description + '</span>';
    html +=     '</div>';
    html += '</div>';

    return html;
}

function buildHtmlForLoadingIcon()
{
    var html='';
    html += '<div style="vertical-align: 25%; width: 100%;height: 100%;text-align: center;"><img style="text-align: center;" src="../loading.gif"/></div>';
    return html;
}

function getShelf(id)
{
    $("#div_books_table").html(buildHtmlForLoadingIcon());
    $("#canvas_render_viewport").visibility = "hidden";
    $("#img_prev_shelf").hide();
    $("#img_next_shelf").hide();

    env3d_clear();
    __books_entries.length = 0;

    currentRequestId++;

    $.get("/home/get_shelf",
        {id:id},
        function(result)
        {
            $("#span_shelves_selector_name").append(" (" + result.length + ")");

            html = "";
            for(var i = 0; i < result.length; i++)
            {
                __books_entries.push
                    ({
                        title:result[i].book_title,
                        num_pages:result[i].num_pages,
                        image_url: result[i].image_url,
                        avg_rating: result[i].avg_rating,
                        author_image_url: result[i].author_small_image_url,
                        description: result[i].description
                    });
                html += buildHtmlForBookInTable(i, result[i]);
            }

            placeOnBookcases(__books_entries);
            env3d_render();
            $("#div_books_table").html(html);
            $("#canvas_render_viewport").visibility = "visible";
            $("#img_prev_shelf").show();
            $("#img_next_shelf").show();

        },"json");
}

function __pickShelf(x, y)
{
    if (env3d_model_shelves.length == 0)
        return null;

    var vector = new THREE.Vector3(x, y, 0.5);
    env3d_projector.unprojectVector(vector, env3d_camera);

    var cameraPos = env3d_camera.matrixWorld.getPosition().clone();
    vector.subSelf(cameraPos).normalize();

    var ray = new THREE.Ray(cameraPos, vector);

    for (var bookcaseIndex = 0; bookcaseIndex < env3d_model_shelves.length; bookcaseIndex++)
    {
        var shelvesOnBookcase = env3d_model_shelves[bookcaseIndex];

        for (var shelfIndex = 0; shelfIndex < shelvesOnBookcase.length; shelfIndex++)
        {
            var modelsToCheck = jQuery.extend([], env3d_model_books[bookcaseIndex][shelfIndex]);//clone the array
            //modelsToCheck.push(shelvesOnBookcase[shelfIndex]);

            if (ray.intersectObjects(modelsToCheck).length > 0)
                return {bookcaseIndex : bookcaseIndex, shelfIndex:shelfIndex, objects:modelsToCheck};
        }
    }

    return null;
}

function __pickBook(x, y)
{
    var vector = new THREE.Vector3(x, y, 0.5);
    env3d_projector.unprojectVector(vector, env3d_camera);

    var cameraPos = env3d_camera.matrixWorld.getPosition().clone();
    vector.subSelf(cameraPos).normalize();

    var ray = new THREE.Ray(cameraPos, vector);

    var absoluteIndex = 0;
    for (var bookcaseIndex = 0; bookcaseIndex < env3d_model_books.length; bookcaseIndex++)
    {
        var shelvesOnBookcase = env3d_model_books[bookcaseIndex];

        for (var shelfIndex = 0; shelfIndex < shelvesOnBookcase.length; shelfIndex++)
        {
            for (var bookIndex = 0; bookIndex < shelvesOnBookcase[shelfIndex].length; bookIndex++)
            {
                if (ray.intersectObject(shelvesOnBookcase[shelfIndex][bookIndex]).length > 0)
                    return {bookcaseIndex : bookcaseIndex, shelfIndex:shelfIndex, bookIndex:absoluteIndex, object:shelvesOnBookcase[shelfIndex][bookIndex]};
                absoluteIndex++;
            }
        }
    }

    return null;
}

// return {bookcaseIndex:..., shelfIndex:..., model:...,}
function __pickBookByIndex(bookIndex)
{
    var firstIndexOfShelf = 0;
    for (var caseIndex = 0; caseIndex < env3d_model_bookcases.length; caseIndex++)
    {
        var shelvesOfCase = env3d_model_books[caseIndex];
        for (var shelfIndex = 0; shelfIndex < shelvesOfCase.length; shelfIndex++)
        {
            if (bookIndex < firstIndexOfShelf + shelvesOfCase[shelfIndex].length)
            {
                return {bookcaseIndex:caseIndex, shelfIndex:shelfIndex, bookIndex: bookIndex, object:shelvesOfCase[shelfIndex][bookIndex-firstIndexOfShelf]};
            }
            firstIndexOfShelf += shelvesOfCase[shelfIndex].length;
        }
    }
    return null;
}