class RenameOwnedBookToBook < ActiveRecord::Migration
  def up
    rename_table :current_books, :books
  end

  def down
    rename_table :books, :current_books
  end
end
