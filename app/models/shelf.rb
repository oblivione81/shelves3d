class Shelf
  attr_accessor :shelf_id
  attr_accessor :shelf_name
  attr_accessor :shelf_book_count

  def initialize(*args)
    if args.length > 0
      shelf_node = args[0]
      @shelf_id = shelf_node.at("id").content()
      @shelf_name = shelf_node.at("name").content()
      @shelf_book_count = shelf_node.at("book_count").content()
    end
  end

  def Shelf.create_owned_books_shelf()
    shelf = Shelf.new()
    shelf.shelf_id = 0
    shelf.shelf_name = "owned books"
    shelf.shelf_book_count = 0
    return shelf
  end
end
