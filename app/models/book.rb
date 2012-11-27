class Book
  attr_accessor :book_id
  attr_accessor :book_title
  attr_accessor :book_image_url
  attr_accessor :book_num_pages
  attr_accessor :book_average_rating
  attr_accessor :author_name
  attr_accessor :author_image_url
  attr_accessor :author_small_image_url

  def initialize(book_node)
    @book_id = book_node.at("id").content()
    @book_title = book_node.at("title").content()
    @book_image_url = book_node.at("image_url").content()
    @book_num_pages = book_node.at("num_pages").content()
    @book_average_rating = book_node.at("average_rating").content()

    author_node = book_node.at("authors").at("author")
    @author_name = author_node.at("name").content()
    @author_image_url = author_node.at("image_url").content()
    @author_small_image_url = author_node.at("small_image_url").content()
  end
end
