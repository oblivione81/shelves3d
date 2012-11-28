class Book
  attr_accessor :id
  attr_accessor :title
  attr_accessor :image_url
  attr_accessor :num_pages
  attr_accessor :avg_rating
  attr_accessor :description
  attr_accessor :author_name
  attr_accessor :author_image_url
  attr_accessor :author_small_image_url

  def initialize(book_node)
    @id = book_node.at("id").content()
    @title = book_node.at("title").content()
    @image_url = book_node.at("image_url").content()
    @num_pages = book_node.at("num_pages").content()
    @avg_rating = book_node.at("average_rating").content()
    @description = book_node.at("description").content()

    author_node = book_node.at("authors").at("author")
    @author_name = author_node.at("name").content()
    @author_image_url = author_node.at("image_url").content()
    @author_small_image_url = author_node.at("small_image_url").content()
  end
end
