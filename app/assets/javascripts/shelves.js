/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 22/11/12
 * Time: 0.54
 * To change this template use File | Settings | File Templates.
 */

function placeOnABookcase(bookcaseModel, booksEntries, shelvesModels, booksModels)
{
    var node = null;
    var index = 0;

    do
    {
        node = bookcaseModel.getChildByName("sh" + index, true);
        if (node)
        {
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

//books_entries: array of {book_title, book_num_pages, book_image_url}
function placeOnAShelve(booksEntries, shelveNode, fromIndex, booksModels)
{
    var offset = 0;
    var temp_max_books = 20;

    for (var i = 0; i < temp_max_books && fromIndex + i < booksEntries.length; i++)
    {
        var abs_index = fromIndex + i;
        if (shelveNode.geometry)
        {
            var pages = booksEntries[abs_index].book_num_pages;

            var book_size =  pages * 5 / 350;
            book_size *= (1 / Math.log(pages));

            var book_height = 6 + 2 * Math.random();
            var geo = new THREE.CubeGeometry(book_size, book_height, 6);

            c = random_color();
            var texture = THREE.ImageUtils.loadTexture
                (
                    "/home/proxy?url=" + booksEntries[abs_index].book_image_url,
                    {},
                    function() {}
                );

            //var mat = new THREE.MeshBasicMaterial({color : colorToHex(c[0], c[1], c[2])});
            var mat = new THREE.MeshBasicMaterial({/*color : colorToHex(c[0], c[1], c[2]),*/ map: texture});
            var bookMesh = new THREE.Mesh(geo, mat);

            var book = new THREE.Object3D;
            book.add(bookMesh);
            book.name = "b"+ abs_index;
            book.position.x = offset + shelveNode.position.x + book_size / 2;
            book.position.y = shelveNode.position.y + book_height / 2.0;
            book.position.z = shelveNode.position.z - 4;

            var bookcase = shelveNode.parent;
            bookcase.add(book);
            booksModels.push(bookMesh);

            offset += book_size + 0.4;
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
    var bookLinkGR = "http://www.goodreads.com/book/show/" + book.book_id;

    var html='';
    html += '<div onmouseout="clearBookHighlight();" onmouseover="highlightBook('+ row + ');" class="book_entry id="' + row + '">';
    html +=     '<div class="title">' + book.book_title + '</div>';
    html +=     '<div class="author">' + book.author_name + '</div>';
    html +=     '<span class="icons_list_left">';
    html +=         '<a href="' + bookLinkGR  + '"><img class="small_icon" src="../gr_icon.jpg"/></a>';
    html +=         '<img class="small_icon" src="../info.gif"/>';
    html +=     '</span>';
    html +=     '<span class="icons_list_right">';
    html +=         '<img onclick="zoomOnBook('+ row + ')" class="small_icon" src="../lens.png"/>';
    html +=     '</span>';
    html += '</div>';

    return html;
}

function buildHtmlForLoadingIcon()
{
    var html='';
    html += '<img style="text-align: center;" src="../loading.gif"/>';
    return html;
}

function getShelf(id)
{
    $("#div_books_table").html(buildHtmlForLoadingIcon());
    $("#canvas_render_viewport").visibility = "hidden";
    env3d_clear();

    $.get("/home/get_shelf",
        {id:id},
        function(result)
        {
            var books_entries = [];

            html = "";
            for(var i = 0; i < result.length; i++)
            {
                books_entries.push
                    ({
                        book_title:result[i].book_title,
                        book_num_pages:result[i].book_num_pages,
                        book_image_url: result[i].book_image_url
                    });
                html += buildHtmlForBookInTable(i, result[i]);
            }

            placeOnBookcases(books_entries);
            env3d_render();
            $("#div_books_table").html(html)
            $("#canvas_render_viewport").visibility = "visible";
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
            modelsToCheck.push(shelvesOnBookcase[shelfIndex]);

            if (ray.intersectObjects(modelsToCheck).length > 0)
                return {bookcaseIndex : bookcaseIndex, shelfIndex:shelfIndex, objects:modelsToCheck};
        }
    }

    return null;
}

// return {bookcaseIndex:..., shelfIndex:..., model:...}
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
                return {bookcaseIndex:caseIndex, shelfIndex:shelfIndex, object:shelvesOfCase[shelfIndex][bookIndex-firstIndexOfShelf]};
            }
            firstIndexOfShelf += shelvesOfCase[shelfIndex].length;
        }
    }
    return null;
}