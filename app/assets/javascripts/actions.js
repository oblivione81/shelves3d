/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 22/11/12
 * Time: 1.13
 * To change this template use File | Settings | File Templates.
 */

//NOTE: This file depends on globals defined in env3d.js

function highlightBook(bookIndex)
{
    var bookModel = findBookModelByIndex(bookIndex, env3d_model_books);
    if (bookModel)
    {
        //      bookModel.material.color = new THREE.Color(0xFF0000);
        env3d_highlighted_model = bookModel;
        bookPosition = env3d_model_environment_model.worldToLocal(bookModel.matrixWorld.getPosition().clone());
        env3d_camera.position = bookPosition
        env3d_camera.position.z += 30;
        env3d_camera.lookAt(bookPosition);
    }
    else
    {
        console.log("Book model not found at index:" + bookIndex);
    }
}