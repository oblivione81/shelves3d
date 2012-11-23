/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 22/11/12
 * Time: 0.54
 * To change this template use File | Settings | File Templates.
 */

function placeOnABookcase(bookcaseModel, booksEntries, booksModels)
{
    var shelvesNodes = [];
    var node = null;
    var index = 0;

    do
    {
        node = bookcaseModel.getChildByName("sh" + index, true);
        if (node)
            shelvesNodes.push(node);
        index++;
    }while(node && index < 100 /*sanity check!*/);

    if (shelvesNodes.length > 0)
        return placeOnShelves(booksEntries, shelvesNodes, booksModels);
    else
        return 0;
}

function placeOnShelves(booksEntries, shelvesNodes, booksModels)
{
    var from_index = 0;
    var shelf_index = 0;

    while (from_index < booksEntries.length)
    {
        from_index = placeOnAShelve(booksEntries, shelvesNodes[shelf_index], from_index, booksModels);
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
            var book = new THREE.Mesh(geo, mat);

            book.position.x = offset + shelveNode.position.x + book_size / 2;
            book.position.y = shelveNode.position.y + book_height / 2.0 + 0.5;
            book.position.z = shelveNode.position.z - 4;

            var bookcase = shelveNode.parent;
            bookcase.add(book);
            booksModels.push(book);

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