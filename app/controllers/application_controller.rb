require 'oauth'
require 'constants'

class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :check_login, :except => [:authorized, :proxy]

  def check_login
    if (!session[:user_id])
      auth_request
    end
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
end
