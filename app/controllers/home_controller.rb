
require 'oauth'
require 'constants'
require 'utils'

class HomeController < ApplicationController


  def index
    #session[:owned_books] = []
  end





  def proxy
    url = URI.parse(params["url"])
    result = Net::HTTP.get_response(url)
    send_data result.body, :type => 'image/jpeg', :disposition => 'inline'
  end

  def get_shelf
    shelf_id = params[:id]
    access_token = prepare_access_token(session[:access_token], session[:access_token_secret])

    if shelf_id && shelf_id != '0'
      shelf = session[:user_shelves][shelf_id]
      puts "requesting #{shelf.shelf_name}"
      request_string = "/review/list.xml?v=2&key=#{KEY}&id=#{session[:user_id]}&shelf=#{shelf.shelf_name}"
      puts request_string
      response = access_token.get(request_string)
    else
      response = access_token.get("/owned_books/user?format=xml&id=#{session[:user_id]}")
    end

    xml_response = Nokogiri.XML(response.body)
    books_nodes = xml_response.xpath("//book")

    current_books = []

    (1..21).each do
    books_nodes.each do |book_node|
      book_entry = Book.new(book_node)
      current_books.push(book_entry)
    end
    end
    render :json => current_books

  end


end
