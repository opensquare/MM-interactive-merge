<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="xml" encoding="UTF-8" />
	
	<xsl:template match="/">
		<merge xmlns="">
			<xsl:variable name="mainTemplate" select="//payload//template/fileName"/>
			<xsl:variable name="file" select="//templates//field[file/@loaded='false' and file!='$mainTemplate'][1]/file"/>
			<xsl:apply-templates select="//jobId | //jobDetails | //payload"/>
			<templates>
				<xsl:call-template name="addFields">
					<xsl:with-param name="file" select="$file"/>
				</xsl:call-template>
			</templates>
			<templateLoader>
				<nextTemplate>
					<xsl:copy-of select="$file"/>
				</nextTemplate>
				<loaded>
					<xsl:copy-of select="//templateLoader/nextTemplate/file"/>
					<xsl:copy-of select="//templateLoader/loadedTemplates"/>
				</loaded>
			</templateLoader>
		</merge>
		
	</xsl:template>

	<xsl:template match="*[name()!='templateLoader']">
		<xsl:param name="file" select="''"/>
		<xsl:element name="{name()}">
			<xsl:choose>
				<xsl:when test="name() = 'file' and $file=child::text()">
					<xsl:attribute name="loaded">true</xsl:attribute>
					<xsl:apply-templates select="node()"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:apply-templates select="@* | node()">
						<xsl:with-param name="file" select="$file"/>
					</xsl:apply-templates>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:element>
	</xsl:template>

	<xsl:template match="@*">
		<xsl:attribute name="{name()}">
			<xsl:value-of select="."/>
		</xsl:attribute>
	</xsl:template>

	<xsl:template name="addFields">
		<xsl:param name="file"/>
		<ifl>
			<xsl:apply-templates select="/merge/templates/ifl/* | /merge/templates/next/*">
				<xsl:with-param name="file" select="$file"/>
			</xsl:apply-templates>
		</ifl>
	</xsl:template>

</xsl:stylesheet>