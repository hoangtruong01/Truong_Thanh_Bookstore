class CategoryModel {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? image;
  final String? parentId;

  CategoryModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.image,
    this.parentId,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    String? pId;
    if (json['parentId'] != null) {
      if (json['parentId'] is Map) {
        pId = json['parentId']['_id'];
      } else {
        pId = json['parentId'].toString();
      }
    }

    return CategoryModel(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      description: json['description'],
      image: json['image'],
      parentId: pId,
    );
  }
}
