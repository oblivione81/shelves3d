
require 'oauth'
require 'constants'
require 'utils'

class HomeController < ApplicationController


  def index
    #session[:owned_books] = []
  end

  def auth_request
    consumer = OAuth::Consumer.new(KEY, SECRET, :site=>WEBSITE)
    session[:request_token] = consumer.get_request_token
    redirect_url = "#{session[:request_token].authorize_url}&oauth_callback=#{OAUTH_CALLBACK}"
    redirect_to redirect_url
  end

  def authorized
    access_token = session[:request_token].get_access_token
    session.delete(:request_token)

    session[:access_token] = access_token.token
    session[:access_token_secret] = access_token.secret

    response = access_token.get('/api/auth_user')
    xml_response = Nokogiri.XML(response.body)
    session[:user_id] = xml_response.xpath("//@id").to_s

    response = access_token.get("/shelf/list.xml?user_id=#{session[:user_id]}&key=#{KEY}")
    xml_response = Nokogiri.XML(response.body)
    shelves_nodes = xml_response.xpath("//user_shelf")

    user_shelves = {}

    shelves_nodes.each do |shelf_node|
      shelf_entry = Shelf.new(shelf_node)
      user_shelves[shelf_entry.shelf_id] = shelf_entry
    end

    user_shelves[0] = Shelf.create_owned_books_shelf()

    #session[:current_books] = owned_books
    session[:user_shelves] = user_shelves
    redirect_to "/home/index"
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

    (1..1).each do
    books_nodes.each do |book_node|
      book_entry = Book.new(book_node)
      current_books.push(book_entry)
    end
    end
    render :json => current_books

  end


end
