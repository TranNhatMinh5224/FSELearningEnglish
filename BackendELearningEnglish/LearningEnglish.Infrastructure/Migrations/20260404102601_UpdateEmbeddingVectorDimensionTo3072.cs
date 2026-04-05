using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace LearningEnglish.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateEmbeddingVectorDimensionTo3072 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF to_regclass('""TeacherPackageEmbeddings""') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE ""TeacherPackageEmbeddings"" ALTER COLUMN ""EmbeddingVector"" TYPE vector(3072)';
    END IF;

    IF to_regclass('""CourseEmbeddings""') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE ""CourseEmbeddings"" ALTER COLUMN ""EmbeddingVector"" TYPE vector(3072)';
    END IF;
END $$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF to_regclass('""TeacherPackageEmbeddings""') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE ""TeacherPackageEmbeddings"" ALTER COLUMN ""EmbeddingVector"" TYPE vector(768)';
    END IF;

    IF to_regclass('""CourseEmbeddings""') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE ""CourseEmbeddings"" ALTER COLUMN ""EmbeddingVector"" TYPE vector(768)';
    END IF;
END $$;
");
        }
    }
}
