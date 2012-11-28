class Shelf
  attr_accessor :id
  attr_accessor :name
  attr_accessor :book_count

  def initialize(*args)
    if args.length > 0
      shelf_node = args[0]
      @id = shelf_node.at("id").content()
      @name = shelf_node.at("name").content()
      @book_count = shelf_node.at("book_count").content()
      puts "*********************************************\n*********************************** "
      puts shelf_node.at("name").content()
    end
  end

  def Shelf.create_owned_books_shelf()
    shelf = Shelf.new()
    shelf.id = 0
    shelf.name = "owned books"
    shelf.book_count = 0
    return shelf
  end
end
